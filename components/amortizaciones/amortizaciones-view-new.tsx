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
import { Plus, Calculator, Loader2, Filter } from "lucide-react"
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

const AmortizacionesView: React.FC = () => {
  const { toast } = useToast()
  const [amortizaciones, setAmortizaciones] = useState<Amortizacion[]>([])
  const [activos, setActivos] = useState<Activo[]>([])
  const [loading, setLoading] = useState(true)
  const [isCalcularDialogOpen, setIsCalcularDialogOpen] = useState(false)
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear().toString(),
    mes: "",
    activo_id: "",
  })
  const [calcularData, setCalcularData] = useState({
    activo_id: "",
    año: new Date().getFullYear().toString(),
    mes: "",
    metodo: "automatico",
  })

  // Cargar amortizaciones desde la API
  const cargarAmortizaciones = async () => {
    try {
      setLoading(true)
      let url = '/api/amortizaciones'
      const params = new URLSearchParams()
      
      if (filtros.año) params.append('año', filtros.año)
      if (filtros.mes) params.append('mes', filtros.mes)
      if (filtros.activo_id) params.append('activoId', filtros.activo_id)
      
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

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarAmortizaciones()
    cargarActivos()
  }, [])

  // Recargar cuando cambien los filtros
  useEffect(() => {
    cargarAmortizaciones()
  }, [filtros])

  // Calcular amortizaciones
  const handleCalcularAmortizaciones = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const params = new URLSearchParams({
        año: calcularData.año,
        ...(calcularData.mes && { mes: calcularData.mes }),
        ...(calcularData.activo_id && { activoId: calcularData.activo_id }),
        metodo: calcularData.metodo,
      })

      const response = await fetch(`/api/amortizaciones/calcular?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Amortizaciones calculadas",
          description: `Se calcularon ${result.data?.cantidad || 0} amortizaciones correctamente.`,
        })
        await cargarAmortizaciones()
        setIsCalcularDialogOpen(false)
        resetCalcularForm()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron calcular las amortizaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error calculando amortizaciones:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const resetCalcularForm = () => {
    setCalcularData({
      activo_id: "",
      año: new Date().getFullYear().toString(),
      mes: "",
      metodo: "automatico",
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Calcular Amortizaciones</DialogTitle>
              <DialogDescription>
                Calcula las amortizaciones automáticamente para el período seleccionado
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCalcularAmortizaciones}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calc_año">Año</Label>
                    <Input
                      id="calc_año"
                      type="number"
                      value={calcularData.año}
                      onChange={(e) => setCalcularData({ ...calcularData, año: e.target.value })}
                      min="2020"
                      max="2030"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calc_mes">Mes (opcional)</Label>
                    <Select
                      value={calcularData.mes}
                      onValueChange={(value) => setCalcularData({ ...calcularData, mes: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los meses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los meses</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {getNombreMes(i + 1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calc_activo_id">Activo (opcional)</Label>
                  <Select
                    value={calcularData.activo_id}
                    onValueChange={(value) => setCalcularData({ ...calcularData, activo_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los activos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los activos</SelectItem>
                      {activos.map((activo) => (
                        <SelectItem key={activo.id} value={activo.id.toString()}>
                          {activo.nombre} - {activo.cliente_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="automatico">Automático (usar configuración de categoría)</SelectItem>
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
          <div className="grid grid-cols-3 gap-4">
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
                  <SelectItem value="">Todos los meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {getNombreMes(i + 1)}
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
                  <SelectItem value="">Todos los activos</SelectItem>
                  {activos.map((activo) => (
                    <SelectItem key={activo.id} value={activo.id.toString()}>
                      {activo.nombre} - {activo.cliente_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                <TableHead>Período</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Inicial</TableHead>
                <TableHead>Cuota Amortización</TableHead>
                <TableHead>Valor Final</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Automático</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amortizaciones.map((amortizacion) => (
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
