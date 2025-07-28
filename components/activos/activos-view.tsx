"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Package, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Activo {
  id: number
  nombre: string
  descripcion?: string
  categoria_id: number
  cliente_id: number
  valor_adquisicion: number
  valor_residual?: number
  fecha_adquisicion: string
  fecha_alta: string
  numero_serie?: string
  proveedor?: string
  ubicacion?: string
  estado: string
  activo: boolean
  categoria_nombre: string
  cliente_nombre: string
  cliente_rut: string
  fecha_creacion: string
  fecha_actualizacion: string
}

interface Categoria {
  id: number
  nombre: string
}

interface Cliente {
  id: number
  nombre: string
  rut: string
}

type SortField = 'nombre' | 'categoria_nombre' | 'cliente_nombre' | 'valor_adquisicion' | 'fecha_adquisicion' | 'estado'
type SortDirection = 'asc' | 'desc'

const ActivosView: React.FC = () => {
  const { toast } = useToast()
  const [activos, setActivos] = useState<Activo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null)
  
  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("all")
  const [clienteFilter, setClienteFilter] = useState("all")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>('nombre')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria_id: "",
    cliente_id: "",
    valor_adquisicion: "",
    valor_residual: "",
    fecha_adquisicion: "",
    numero_serie: "",
    proveedor: "",
    ubicacion: "",
    estado: "en_uso",
  })

  // Cargar activos desde la API
  const cargarActivos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/activos')
      const result = await response.json()
      
      if (result.success) {
        setActivos(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los activos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cargando activos:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      const result = await response.json()
      
      if (result.success) {
        setCategorias(result.data)
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const result = await response.json()
      
      if (result.success) {
        setClientes(result.data)
      }
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarActivos()
    cargarCategorias()
    cargarClientes()
  }, [])

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const datos = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        categoria_id: Number.parseInt(formData.categoria_id),
        cliente_id: Number.parseInt(formData.cliente_id),
        valor_adquisicion: Number.parseFloat(formData.valor_adquisicion),
        valor_residual: formData.valor_residual ? Number.parseFloat(formData.valor_residual) : undefined,
        fecha_adquisicion: formData.fecha_adquisicion,
        numero_serie: formData.numero_serie || undefined,
        proveedor: formData.proveedor || undefined,
        ubicacion: formData.ubicacion || undefined,
        estado: formData.estado,
      }

      if (editingActivo) {
        // Actualizar activo existente
        const response = await fetch(`/api/activos/${editingActivo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Activo actualizado",
            description: "El activo se ha actualizado correctamente.",
          })
          await cargarActivos()
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo actualizar el activo",
            variant: "destructive",
          })
        }
      } else {
        // Crear nuevo activo
        const response = await fetch('/api/activos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Activo creado",
            description: "El nuevo activo se ha creado correctamente.",
          })
          await cargarActivos()
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo crear el activo",
            variant: "destructive",
          })
        }
      }

      setIsDialogOpen(false)
      setEditingActivo(null)
      resetForm()
    } catch (error) {
      console.error('Error enviando formulario:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (activo: Activo) => {
    // Verificar si los IDs existen y convertirlos correctamente
    const categoriaIdStr = activo.categoria_id != null ? String(activo.categoria_id) : ""
    const clienteIdStr = activo.cliente_id != null ? String(activo.cliente_id) : ""
    
    setEditingActivo(activo)
    setFormData({
      nombre: activo.nombre || "",
      descripcion: activo.descripcion || "",
      categoria_id: categoriaIdStr,
      cliente_id: clienteIdStr,
      valor_adquisicion: activo.valor_adquisicion ? activo.valor_adquisicion.toString() : "",
      valor_residual: activo.valor_residual ? activo.valor_residual.toString() : "",
      fecha_adquisicion: activo.fecha_adquisicion ? activo.fecha_adquisicion.split('T')[0] : "", // Solo la fecha
      numero_serie: activo.numero_serie || "",
      proveedor: activo.proveedor || "",
      ubicacion: activo.ubicacion || "",
      estado: activo.estado || "en_uso",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/activos/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Activo eliminado",
          description: "El activo se ha eliminado correctamente.",
        })
        await cargarActivos()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el activo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error eliminando activo:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      categoria_id: "",
      cliente_id: "",
      valor_adquisicion: "",
      valor_residual: "",
      fecha_adquisicion: "",
      numero_serie: "",
      proveedor: "",
      ubicacion: "",
      estado: "en_uso",
    })
    setEditingActivo(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value)
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      'en_uso': { variant: 'default' as const, label: 'En Uso' },
      'mantenimiento': { variant: 'secondary' as const, label: 'Mantenimiento' },
      'fuera_servicio': { variant: 'destructive' as const, label: 'Fuera de Servicio' },
      'vendido': { variant: 'outline' as const, label: 'Vendido' },
      'dado_baja': { variant: 'outline' as const, label: 'Dado de Baja' },
      'depreciado': { variant: 'secondary' as const, label: 'Depreciado' },
      'desechado': { variant: 'destructive' as const, label: 'Desechado' }
    }
    const estadoInfo = estados[estado as keyof typeof estados] || { variant: 'secondary' as const, label: estado }
    return <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
  }

  // Función para manejar el ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setCategoriaFilter("all")
    setClienteFilter("all")
    setEstadoFilter("all")
  }

  // Activos filtrados y ordenados usando useMemo para optimizar rendimiento
  const activosFiltrados = useMemo(() => {
    let filtrados = activos.filter(activo => {
      const matchesSearch = activo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activo.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategoria = categoriaFilter === "all" || activo.categoria_id.toString() === categoriaFilter
      const matchesCliente = clienteFilter === "all" || activo.cliente_id.toString() === clienteFilter
      const matchesEstado = estadoFilter === "all" || activo.estado === estadoFilter

      return matchesSearch && matchesCategoria && matchesCliente && matchesEstado
    })

    // Aplicar ordenamiento
    filtrados.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'nombre':
          aValue = a.nombre.toLowerCase()
          bValue = b.nombre.toLowerCase()
          break
        case 'categoria_nombre':
          aValue = a.categoria_nombre.toLowerCase()
          bValue = b.categoria_nombre.toLowerCase()
          break
        case 'cliente_nombre':
          aValue = a.cliente_nombre.toLowerCase()
          bValue = b.cliente_nombre.toLowerCase()
          break
        case 'valor_adquisicion':
          aValue = a.valor_adquisicion
          bValue = b.valor_adquisicion
          break
        case 'fecha_adquisicion':
          aValue = new Date(a.fecha_adquisicion)
          bValue = new Date(b.fecha_adquisicion)
          break
        case 'estado':
          aValue = a.estado.toLowerCase()
          bValue = b.estado.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtrados
  }, [activos, searchTerm, categoriaFilter, clienteFilter, estadoFilter, sortField, sortDirection])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando activos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Activos</h1>
          <p className="text-muted-foreground">Administra los activos fijos de tus clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Activo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingActivo ? "Editar Activo" : "Nuevo Activo"}</DialogTitle>
              <DialogDescription>Registra la información del activo fijo</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Activo</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Laptop Dell XPS 13"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_serie">Número de Serie</Label>
                    <Input
                      id="numero_serie"
                      value={formData.numero_serie}
                      onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                      placeholder="Número de serie"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción detallada del activo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria_id">Categoría</Label>
                    <Select
                      value={formData.categoria_id}
                      onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Cliente</Label>
                    <Select
                      value={formData.cliente_id}
                      onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nombre} ({cliente.rut})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_adquisicion">Valor de Adquisición</Label>
                    <Input
                      id="valor_adquisicion"
                      type="number"
                      step="0.01"
                      value={formData.valor_adquisicion}
                      onChange={(e) => setFormData({ ...formData, valor_adquisicion: e.target.value })}
                      placeholder="1000000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_residual">Valor Residual</Label>
                    <Input
                      id="valor_residual"
                      type="number"
                      step="0.01"
                      value={formData.valor_residual}
                      onChange={(e) => setFormData({ ...formData, valor_residual: e.target.value })}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_adquisicion">Fecha de Adquisición</Label>
                    <Input
                      id="fecha_adquisicion"
                      type="date"
                      value={formData.fecha_adquisicion}
                      onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor</Label>
                    <Input
                      id="proveedor"
                      value={formData.proveedor}
                      onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      id="ubicacion"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      placeholder="Oficina, Bodega, etc."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_uso">En Uso</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                      <SelectItem value="dado_baja">Dado de Baja</SelectItem>
                      <SelectItem value="depreciado">Depreciado</SelectItem>
                      <SelectItem value="desechado">Desechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingActivo ? "Actualizar" : "Crear"} Activo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sección de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
          <CardDescription>Filtra y busca activos por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, número de serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria-filter">Categoría</Label>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-filter">Cliente</Label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado-filter">Estado</Label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="en_uso">En Uso</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="dado_baja">Dado de Baja</SelectItem>
                  <SelectItem value="depreciado">Depreciado</SelectItem>
                  <SelectItem value="desechado">Desechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
            <span className="text-sm text-muted-foreground">
              Mostrando {activosFiltrados.length} de {activos.length} activos
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activos Registrados</CardTitle>
          <CardDescription>Lista de todos los activos fijos en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center">
                    Nombre
                    {getSortIcon('nombre')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('categoria_nombre')}
                >
                  <div className="flex items-center">
                    Categoría
                    {getSortIcon('categoria_nombre')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('cliente_nombre')}
                >
                  <div className="flex items-center">
                    Cliente
                    {getSortIcon('cliente_nombre')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('valor_adquisicion')}
                >
                  <div className="flex items-center">
                    Valor Adquisición
                    {getSortIcon('valor_adquisicion')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('fecha_adquisicion')}
                >
                  <div className="flex items-center">
                    Fecha Adquisición
                    {getSortIcon('fecha_adquisicion')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('estado')}
                >
                  <div className="flex items-center">
                    Estado
                    {getSortIcon('estado')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {activos.length === 0 ? 'No hay activos registrados' : 'No se encontraron activos con los filtros aplicados'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activosFiltrados.map((activo) => (
                  <TableRow key={activo.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{activo.nombre}</div>
                        {activo.numero_serie && (
                          <div className="text-xs text-muted-foreground">S/N: {activo.numero_serie}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{activo.categoria_nombre}</TableCell>
                    <TableCell>
                      <div>
                        <div>{activo.cliente_nombre}</div>
                        <div className="text-xs text-muted-foreground">{activo.cliente_rut}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(activo.valor_adquisicion)}</TableCell>
                    <TableCell>{new Date(activo.fecha_adquisicion).toLocaleDateString('es-CL')}</TableCell>
                    <TableCell>{getEstadoBadge(activo.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(activo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(activo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivosView
