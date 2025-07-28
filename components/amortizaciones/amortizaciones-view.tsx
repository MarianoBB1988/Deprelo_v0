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
import { Plus, Calculator, Loader2, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Amortizacion {
  id: number
  activo_id: number
  periodo_año: number
  periodo_mes: number
  valor_inicial: number
  cuota_amortizacion: number
  valor_final: number
  metodo_aplicado: string
  calculado_automaticamente: boolean
  observaciones?: string
  fecha_calculo: string
  activo_nombre: string
  numero_serie?: string
  categoria_nombre: string
  cliente_nombre: string
  cliente_rut: string
}

interface Activo {
  id: number
  nombre: string
  categoria_nombre: string
  cliente_nombre: string
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

type SortField = 'activo_nombre' | 'categoria_nombre' | 'cliente_nombre' | 'periodo_año' | 'periodo_mes' | 'valor_inicial' | 'cuota_amortizacion' | 'valor_final'
type SortDirection = 'asc' | 'desc'

const AmortizacionesView: React.FC = () => {
  const { toast } = useToast()
  const [amortizaciones, setAmortizaciones] = useState<Amortizacion[]>([])
  const [activos, setActivos] = useState<Activo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isCalcularDialogOpen, setIsCalcularDialogOpen] = useState(false)
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<SortField>('periodo_año')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear().toString(),
    mes: "all",
    activo_id: "all",
    categoria_id: "all",
    cliente_id: "all",
  })
  const [calcularData, setCalcularData] = useState({
    activo_id: "all",
    año: new Date().getFullYear().toString(),
    mes: "all",
    metodo: "automatico",
    cliente_id: undefined as string | undefined,
    categoria_id: undefined as string | undefined,
  })

  // Cargar amortizaciones desde la API
  const cargarAmortizaciones = async () => {
    try {
      setLoading(true)
      let url = '/api/amortizaciones'
      const params = new URLSearchParams()
      
      if (filtros.año) params.append('año', filtros.año)
      if (filtros.mes && filtros.mes !== "all") params.append('mes', filtros.mes)
      if (filtros.activo_id && filtros.activo_id !== "all") params.append('activoId', filtros.activo_id)
      if (filtros.categoria_id && filtros.categoria_id !== "all") params.append('categoriaId', filtros.categoria_id)
      if (filtros.cliente_id && filtros.cliente_id !== "all") params.append('clienteId', filtros.cliente_id)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setAmortizaciones(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las amortizaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cargando amortizaciones:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar activos
  const cargarActivos = async () => {
    try {
      const response = await fetch('/api/activos')
      const result = await response.json()
      
      if (result.success) {
        setActivos(result.data)
      }
    } catch (error) {
      console.error('Error cargando activos:', error)
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
    cargarAmortizaciones()
    cargarActivos()
    cargarCategorias()
    cargarClientes()
  }, [])

  // Recargar cuando cambien los filtros
  useEffect(() => {
    cargarAmortizaciones()
  }, [filtros])

  // Calcular amortizaciones
  const handleCalcularAmortizaciones = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const requestBody = {
        anio: calcularData.año,
        ...(calcularData.mes && calcularData.mes !== "all" && { mes: calcularData.mes }),
        ...(calcularData.activo_id && calcularData.activo_id !== "all" && { activo_id: calcularData.activo_id }),
        ...(calcularData.cliente_id && { cliente_id: calcularData.cliente_id }),
        ...(calcularData.categoria_id && { categoria_id: calcularData.categoria_id }),
        metodo: calcularData.metodo,
      }

      console.log('🚀 Enviando solicitud de cálculo:', requestBody)

      const response = await fetch('/api/amortizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 Response status:', response.status)
      const result = await response.json()
      console.log('📊 Response data:', result)

      if (result.success) {
        toast({
          title: "Amortizaciones calculadas",
          description: result.message || "Amortizaciones procesadas correctamente.",
        })
        await cargarAmortizaciones()
        setIsCalcularDialogOpen(false)
        resetCalcularForm()
      } else {
        console.error('❌ Error en el servidor:', result.error)
        toast({
          title: "Error",
          description: result.error || "No se pudieron calcular las amortizaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 Error calculando amortizaciones:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const resetCalcularForm = () => {
    setCalcularData({
      activo_id: "all",
      año: new Date().getFullYear().toString(),
      mes: "all",
      metodo: "automatico",
      cliente_id: undefined,
      categoria_id: undefined,
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value)
  }

  const getMetodoBadge = (metodo: string) => {
    const metodos = {
      'lineal': { variant: 'default' as const, label: 'Lineal' },
      'decreciente': { variant: 'secondary' as const, label: 'Decreciente' },
      'acelerada': { variant: 'outline' as const, label: 'Acelerada' }
    }
    const metodoInfo = metodos[metodo as keyof typeof metodos] || { variant: 'secondary' as const, label: metodo }
    return <Badge variant={metodoInfo.variant}>{metodoInfo.label}</Badge>
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

  // Amortizaciones ordenadas usando useMemo para optimizar rendimiento
  const amortizacionesOrdenadas = useMemo(() => {
    const amortizacionesCopia = [...amortizaciones]
    
    amortizacionesCopia.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'activo_nombre':
          aValue = a.activo_nombre.toLowerCase()
          bValue = b.activo_nombre.toLowerCase()
          break
        case 'categoria_nombre':
          aValue = a.categoria_nombre.toLowerCase()
          bValue = b.categoria_nombre.toLowerCase()
          break
        case 'cliente_nombre':
          aValue = a.cliente_nombre.toLowerCase()
          bValue = b.cliente_nombre.toLowerCase()
          break
        case 'periodo_año':
          aValue = a.periodo_año
          bValue = b.periodo_año
          break
        case 'periodo_mes':
          aValue = a.periodo_mes
          bValue = b.periodo_mes
          break
        case 'valor_inicial':
          aValue = a.valor_inicial
          bValue = b.valor_inicial
          break
        case 'cuota_amortizacion':
          aValue = a.cuota_amortizacion
          bValue = b.cuota_amortizacion
          break
        case 'valor_final':
          aValue = a.valor_final
          bValue = b.valor_final
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return amortizacionesCopia
  }, [amortizaciones, sortField, sortDirection])

  const getNombreMes = (mes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[mes - 1] || mes.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando amortizaciones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Amortizaciones</h1>
          <p className="text-muted-foreground">Gestiona el cálculo y seguimiento de amortizaciones</p>
        </div>
        <Dialog open={isCalcularDialogOpen} onOpenChange={(open) => {
          setIsCalcularDialogOpen(open)
          if (!open) resetCalcularForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Amortizaciones
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Calcular Amortizaciones</DialogTitle>
              <DialogDescription>
                Calcula las amortizaciones usando los parámetros anuales configurados (según DGI Uruguay). 
                Selecciona los filtros para calcular amortizaciones específicas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCalcularAmortizaciones}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {/* Año - Obligatorio */}
                <div className="space-y-2">
                  <Label htmlFor="calc_año">Año Fiscal *</Label>
                  <Input
                    id="calc_año"
                    type="number"
                    value={calcularData.año}
                    onChange={(e) => setCalcularData({ ...calcularData, año: e.target.value })}
                    min="2020"
                    max="2030"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Se usarán los parámetros anuales configurados para este año
                  </p>
                </div>

                {/* Filtros opcionales */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Filtros de Aplicación (Opcionales)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calc_cliente">Cliente/Empresa</Label>
                      <Select
                        value={calcularData.cliente_id || "all"}
                        onValueChange={(value) => {
                          const newClienteId = value === "all" ? undefined : value
                          setCalcularData({ 
                            ...calcularData, 
                            cliente_id: newClienteId,
                            // Resetear activo si el cliente cambia
                            activo_id: newClienteId !== calcularData.cliente_id ? "all" : calcularData.activo_id
                          })
                        }}
                      >
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
                      <Label htmlFor="calc_categoria">Categoría</Label>
                      <Select
                        value={calcularData.categoria_id || "all"}
                        onValueChange={(value) => {
                          const newCategoriaId = value === "all" ? undefined : value
                          setCalcularData({ 
                            ...calcularData, 
                            categoria_id: newCategoriaId,
                            // Resetear activo si la categoría cambia
                            activo_id: newCategoriaId !== calcularData.categoria_id ? "all" : calcularData.activo_id
                          })
                        }}
                      >
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
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="calc_mes">Mes</Label>
                      <Select
                        value={calcularData.mes}
                        onValueChange={(value) => setCalcularData({ ...calcularData, mes: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los meses</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {getNombreMes(i + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="calc_activo_id">Activo Específico</Label>
                      <Select
                        value={calcularData.activo_id}
                        onValueChange={(value) => setCalcularData({ ...calcularData, activo_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los activos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los activos</SelectItem>
                          {activos
                            .filter((activo) => {
                              // Filtrar por cliente si hay uno seleccionado
                              if (calcularData.cliente_id && calcularData.cliente_id !== "all") {
                                const cliente = clientes.find(c => c.id.toString() === calcularData.cliente_id)
                                return activo.cliente_nombre === cliente?.nombre
                              }
                              // Filtrar por categoría si hay una seleccionada
                              if (calcularData.categoria_id && calcularData.categoria_id !== "all") {
                                const categoria = categorias.find(c => c.id.toString() === calcularData.categoria_id)
                                return activo.categoria_nombre === categoria?.nombre
                              }
                              return true
                            })
                            .map((activo) => (
                            <SelectItem key={activo.id} value={activo.id.toString()}>
                              {activo.nombre} - {activo.cliente_nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calc_metodo">Método</Label>
                  <Select
                    value={calcularData.metodo}
                    onValueChange={(value) => setCalcularData({ ...calcularData, metodo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatico">Automático (usar parámetros anuales)</SelectItem>
                      <SelectItem value="recalcular">Recalcular (sobrescribir existentes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCalcularDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Calcular Amortizaciones
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro_año">Año</Label>
              <Input
                id="filtro_año"
                type="number"
                value={filtros.año}
                onChange={(e) => setFiltros({ ...filtros, año: e.target.value })}
                min="2020"
                max="2030"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_mes">Mes</Label>
              <Select
                value={filtros.mes}
                onValueChange={(value) => setFiltros({ ...filtros, mes: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {getNombreMes(i + 1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_categoria">Categoría</Label>
              <Select
                value={filtros.categoria_id}
                onValueChange={(value) => setFiltros({ ...filtros, categoria_id: value })}
              >
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
              <Label htmlFor="filtro_cliente">Cliente</Label>
              <Select
                value={filtros.cliente_id}
                onValueChange={(value) => setFiltros({ ...filtros, cliente_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre} ({cliente.rut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_activo">Activo</Label>
              <Select
                value={filtros.activo_id}
                onValueChange={(value) => setFiltros({ ...filtros, activo_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los activos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los activos</SelectItem>
                  {activos.map((activo) => (
                    <SelectItem key={activo.id} value={activo.id.toString()}>
                      {activo.nombre} - {activo.cliente_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => setFiltros({
                año: new Date().getFullYear().toString(),
                mes: "all",
                activo_id: "all",
                categoria_id: "all",
                cliente_id: "all",
              })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de amortizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Amortizaciones Calculadas</CardTitle>
          <CardDescription>
            Registro de las amortizaciones calculadas por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('periodo_año')}
                >
                  <div className="flex items-center">
                    Período
                    {getSortIcon('periodo_año')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('activo_nombre')}
                >
                  <div className="flex items-center">
                    Activo
                    {getSortIcon('activo_nombre')}
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
                  onClick={() => handleSort('valor_inicial')}
                >
                  <div className="flex items-center">
                    Valor Inicial
                    {getSortIcon('valor_inicial')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('cuota_amortizacion')}
                >
                  <div className="flex items-center">
                    Cuota Amortización
                    {getSortIcon('cuota_amortizacion')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('valor_final')}
                >
                  <div className="flex items-center">
                    Valor Final
                    {getSortIcon('valor_final')}
                  </div>
                </TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Automático</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amortizacionesOrdenadas.map((amortizacion) => (
                <TableRow key={amortizacion.id}>
                  <TableCell className="font-medium">
                    {getNombreMes(amortizacion.periodo_mes)} {amortizacion.periodo_año}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{amortizacion.activo_nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {amortizacion.categoria_nombre}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{amortizacion.cliente_nombre}</div>
                      <div className="text-xs text-muted-foreground">{amortizacion.cliente_rut}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(amortizacion.valor_inicial)}</TableCell>
                  <TableCell className="font-medium text-red-600">
                    -{formatCurrency(amortizacion.cuota_amortizacion)}
                  </TableCell>
                  <TableCell>{formatCurrency(amortizacion.valor_final)}</TableCell>
                  <TableCell>{getMetodoBadge(amortizacion.metodo_aplicado)}</TableCell>
                  <TableCell>
                    <Badge variant={amortizacion.calculado_automaticamente ? "default" : "secondary"}>
                      {amortizacion.calculado_automaticamente ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {amortizaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No se encontraron amortizaciones para los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AmortizacionesView
