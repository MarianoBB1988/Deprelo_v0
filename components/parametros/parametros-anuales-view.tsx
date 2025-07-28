"use client"

import React, { useState, useEffect } from "react"
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
import { Plus, Edit, Copy, Settings, Calendar, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ParametroAnual {
  id: number
  categoria_id: number
  categoria_nombre: string
  anio_fiscal: number
  vida_util_anos: number
  metodo_amortizacion: string
  valor_residual_porcentaje: number | string
  tasa_anual_porcentaje: number | string
  coeficiente_ajuste: number | string
  activo: boolean
}

interface Categoria {
  id: number
  nombre: string
}

const ParametrosAnualesView: React.FC = () => {
  const { toast } = useToast()
  const [parametros, setParametros] = useState<ParametroAnual[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCopyYearDialogOpen, setIsCopyYearDialogOpen] = useState(false)
  const [editingParametro, setEditingParametro] = useState<ParametroAnual | null>(null)
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(new Date().getFullYear())
  const [formData, setFormData] = useState({
    categoria_id: "",
    anio_fiscal: new Date().getFullYear().toString(),
    vida_util_anos: "",
    metodo_amortizacion: "lineal",
    valor_residual_porcentaje: "",
    tasa_anual_porcentaje: "",
    coeficiente_ajuste: "1.000000",
  })
  const [copyYearData, setCopyYearData] = useState({
    año_origen: (new Date().getFullYear() - 1).toString(),
    año_destino: new Date().getFullYear().toString(),
    coeficiente_ajuste: "1.045", // 4.5% inflación estimada Uruguay
  })

  // Cargar parámetros anuales
  const cargarParametros = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/parametros-anuales?año=${añoSeleccionado}`)
      const result = await response.json()
      
      if (result.success) {
        setParametros(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los parámetros",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cargando parámetros:', error)
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

  useEffect(() => {
    cargarParametros()
    cargarCategorias()
  }, [añoSeleccionado])

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const datos = {
        categoria_id: parseInt(formData.categoria_id),
        anio_fiscal: parseInt(formData.anio_fiscal),
        vida_util_anos: parseInt(formData.vida_util_anos),
        metodo_amortizacion: formData.metodo_amortizacion,
        valor_residual_porcentaje: parseFloat(formData.valor_residual_porcentaje),
        tasa_anual_porcentaje: parseFloat(formData.tasa_anual_porcentaje),
        coeficiente_ajuste: parseFloat(formData.coeficiente_ajuste),
      }

      if (editingParametro) {
        // Actualizar parámetro existente
        const response = await fetch(`/api/parametros-anuales/${editingParametro.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Parámetro actualizado",
            description: "Los parámetros fiscales se han actualizado correctamente.",
          })
          await cargarParametros()
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo actualizar el parámetro",
            variant: "destructive",
          })
        }
      } else {
        // Crear nuevo parámetro
        const response = await fetch('/api/parametros-anuales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Parámetro creado",
            description: "Los nuevos parámetros fiscales se han creado correctamente.",
          })
          await cargarParametros()
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo crear el parámetro",
            variant: "destructive",
          })
        }
      }

      setIsDialogOpen(false)
      setEditingParametro(null)
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

  // Copiar parámetros de un año a otro
  const handleCopyYear = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/parametros-anuales/copiar-año', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          año_origen: parseInt(copyYearData.año_origen),
          año_destino: parseInt(copyYearData.año_destino),
          coeficiente_ajuste: parseFloat(copyYearData.coeficiente_ajuste),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Parámetros copiados",
          description: `Los parámetros se han copiado desde ${copyYearData.año_origen} a ${copyYearData.año_destino} con ajuste del ${((parseFloat(copyYearData.coeficiente_ajuste) - 1) * 100).toFixed(1)}%`,
        })
        setAñoSeleccionado(parseInt(copyYearData.año_destino))
        await cargarParametros()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron copiar los parámetros",
          variant: "destructive",
        })
      }

      setIsCopyYearDialogOpen(false)
    } catch (error) {
      console.error('Error copiando parámetros:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (parametro: ParametroAnual) => {
    setEditingParametro(parametro)
    setFormData({
      categoria_id: parametro.categoria_id.toString(),
      anio_fiscal: parametro.anio_fiscal.toString(),
      vida_util_anos: parametro.vida_util_anos.toString(),
      metodo_amortizacion: parametro.metodo_amortizacion,
      valor_residual_porcentaje: typeof parametro.valor_residual_porcentaje === 'string' 
        ? parametro.valor_residual_porcentaje 
        : parametro.valor_residual_porcentaje.toString(),
      tasa_anual_porcentaje: typeof parametro.tasa_anual_porcentaje === 'string'
        ? parametro.tasa_anual_porcentaje
        : parametro.tasa_anual_porcentaje.toString(),
      coeficiente_ajuste: typeof parametro.coeficiente_ajuste === 'string'
        ? parametro.coeficiente_ajuste
        : parametro.coeficiente_ajuste.toString(),
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      categoria_id: "",
      anio_fiscal: añoSeleccionado.toString(),
      vida_util_anos: "",
      metodo_amortizacion: "lineal",
      valor_residual_porcentaje: "",
      tasa_anual_porcentaje: "",
      coeficiente_ajuste: "1.000000",
    })
    setEditingParametro(null)
  }

  const formatPercentage = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return `${(numValue * 100).toFixed(2)}%`
  }

  const getMetodoLabel = (metodo: string) => {
    const metodos = {
      'lineal': 'Lineal',
      'decreciente': 'Decreciente',
      'acelerada': 'Acelerada'
    }
    return metodos[metodo as keyof typeof metodos] || metodo
  }

  const añosDisponibles = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parámetros Fiscales Anuales</h1>
          <p className="text-muted-foreground">Gestiona los parámetros de amortización según normativa DGI Uruguay</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCopyYearDialogOpen} onOpenChange={setIsCopyYearDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Año
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copiar Parámetros de Año</DialogTitle>
                <DialogDescription>
                  Copia los parámetros de un año existente y aplica ajustes por inflación/normativa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCopyYear}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="año_origen">Año Origen</Label>
                      <Select
                        value={copyYearData.año_origen}
                        onValueChange={(value) => setCopyYearData({ ...copyYearData, año_origen: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {añosDisponibles.map((año) => (
                            <SelectItem key={año} value={año.toString()}>
                              {año}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="año_destino">Año Destino</Label>
                      <Select
                        value={copyYearData.año_destino}
                        onValueChange={(value) => setCopyYearData({ ...copyYearData, año_destino: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {añosDisponibles.map((año) => (
                            <SelectItem key={año} value={año.toString()}>
                              {año}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coeficiente_ajuste">Coeficiente de Ajuste</Label>
                    <Input
                      id="coeficiente_ajuste"
                      type="number"
                      step="0.001"
                      value={copyYearData.coeficiente_ajuste}
                      onChange={(e) => setCopyYearData({ ...copyYearData, coeficiente_ajuste: e.target.value })}
                      placeholder="1.045 (4.5% inflación)"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Ej: 1.045 = 4.5% de ajuste por inflación
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCopyYearDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Copiar Parámetros
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Parámetro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingParametro ? "Editar Parámetro" : "Nuevo Parámetro Fiscal"}</DialogTitle>
                <DialogDescription>Configure los parámetros de amortización para una categoría específica</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
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
                      <Label htmlFor="anio_fiscal">Año Fiscal</Label>
                      <Input
                        id="anio_fiscal"
                        type="number"
                        value={formData.anio_fiscal}
                        onChange={(e) => setFormData({ ...formData, anio_fiscal: e.target.value })}
                        min="2020"
                        max="2030"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vida_util_anos">Vida Útil (años)</Label>
                      <Input
                        id="vida_util_anos"
                        type="number"
                        value={formData.vida_util_anos}
                        onChange={(e) => setFormData({ ...formData, vida_util_anos: e.target.value })}
                        min="1"
                        max="50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_residual_porcentaje">Valor Residual (%)</Label>
                      <Input
                        id="valor_residual_porcentaje"
                        type="number"
                        step="0.01"
                        value={formData.valor_residual_porcentaje}
                        onChange={(e) => setFormData({ ...formData, valor_residual_porcentaje: e.target.value })}
                        min="0"
                        max="1"
                        placeholder="0.10 (10%)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tasa_anual_porcentaje">Tasa Anual (%)</Label>
                      <Input
                        id="tasa_anual_porcentaje"
                        type="number"
                        step="0.01"
                        value={formData.tasa_anual_porcentaje}
                        onChange={(e) => setFormData({ ...formData, tasa_anual_porcentaje: e.target.value })}
                        min="0"
                        max="1"
                        placeholder="0.33 (33%)"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metodo_amortizacion">Método</Label>
                      <Select
                        value={formData.metodo_amortizacion}
                        onValueChange={(value) => setFormData({ ...formData, metodo_amortizacion: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lineal">Lineal</SelectItem>
                          <SelectItem value="decreciente">Decreciente</SelectItem>
                          <SelectItem value="acelerada">Acelerada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coeficiente_ajuste">Coeficiente Ajuste</Label>
                      <Input
                        id="coeficiente_ajuste"
                        type="number"
                        step="0.001"
                        value={formData.coeficiente_ajuste}
                        onChange={(e) => setFormData({ ...formData, coeficiente_ajuste: e.target.value })}
                        placeholder="1.000"
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingParametro ? "Actualizar" : "Crear"} Parámetro
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selector de año */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Año Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="año_selector">Seleccionar año:</Label>
            <Select
              value={añoSeleccionado.toString()}
              onValueChange={(value) => setAñoSeleccionado(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {añosDisponibles.map((año) => (
                  <SelectItem key={año} value={año.toString()}>
                    {año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de parámetros */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros Fiscales {añoSeleccionado}</CardTitle>
          <CardDescription>
            Parámetros de amortización según normativa DGI Uruguay para el año {añoSeleccionado}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Vida Útil</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor Residual</TableHead>
                <TableHead>Tasa Anual</TableHead>
                <TableHead>Coef. Ajuste</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parametros.map((parametro) => (
                <TableRow key={parametro.id}>
                  <TableCell className="font-medium">{parametro.categoria_nombre}</TableCell>
                  <TableCell>{parametro.vida_util_anos} años</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getMetodoLabel(parametro.metodo_amortizacion)}</Badge>
                  </TableCell>
                  <TableCell>{formatPercentage(parametro.valor_residual_porcentaje)}</TableCell>
                  <TableCell>{formatPercentage(parametro.tasa_anual_porcentaje)}</TableCell>
                  <TableCell>
                    <Badge variant={Number(parametro.coeficiente_ajuste) !== 1 ? "secondary" : "outline"}>
                      {Number(parametro.coeficiente_ajuste).toFixed(3)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(parametro)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ParametrosAnualesView
