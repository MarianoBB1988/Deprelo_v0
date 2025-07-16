"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus, Edit, Trash2, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Activo {
  id: number
  nombre: string
  categoria: string
  cliente: string
  valorAdquisicion: number
  fechaAlta: string
  valorResidual: number
}

export function ActivosView() {
  const { toast } = useToast()
  const [activos, setActivos] = useState<Activo[]>([
    {
      id: 1,
      nombre: "Laptop Dell XPS 13",
      categoria: "Equipos de Computación",
      cliente: "Empresa ABC S.A.",
      valorAdquisicion: 1200,
      fechaAlta: "2024-01-15",
      valorResidual: 120,
    },
    {
      id: 2,
      nombre: "Vehículo Toyota Corolla",
      categoria: "Vehículos",
      cliente: "Comercial XYZ Ltda.",
      valorAdquisicion: 25000,
      fechaAlta: "2023-06-10",
      valorResidual: 5000,
    },
    {
      id: 3,
      nombre: "Impresora HP LaserJet",
      categoria: "Equipos de Computación",
      cliente: "Empresa ABC S.A.",
      valorAdquisicion: 800,
      fechaAlta: "2024-03-20",
      valorResidual: 80,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    cliente: "",
    valorAdquisicion: "",
    fechaAlta: "",
    valorResidual: "",
  })

  const categorias = ["Equipos de Computación", "Vehículos", "Maquinaria", "Inmuebles"]
  const clientes = ["Empresa ABC S.A.", "Comercial XYZ Ltda.", "Servicios DEF S.R.L.", "Industrias GHI S.A."]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newActivo: Activo = {
      id: editingActivo ? editingActivo.id : Date.now(),
      nombre: formData.nombre,
      categoria: formData.categoria,
      cliente: formData.cliente,
      valorAdquisicion: Number.parseFloat(formData.valorAdquisicion),
      fechaAlta: formData.fechaAlta,
      valorResidual: Number.parseFloat(formData.valorResidual),
    }

    if (editingActivo) {
      setActivos(activos.map((activo) => (activo.id === editingActivo.id ? newActivo : activo)))
      toast({
        title: "Activo actualizado",
        description: "El activo se ha actualizado correctamente.",
      })
    } else {
      setActivos([...activos, newActivo])
      toast({
        title: "Activo creado",
        description: "El nuevo activo se ha creado correctamente.",
      })
    }

    setIsDialogOpen(false)
    setEditingActivo(null)
    setFormData({
      nombre: "",
      categoria: "",
      cliente: "",
      valorAdquisicion: "",
      fechaAlta: "",
      valorResidual: "",
    })
  }

  const handleEdit = (activo: Activo) => {
    setEditingActivo(activo)
    setFormData({
      nombre: activo.nombre,
      categoria: activo.categoria,
      cliente: activo.cliente,
      valorAdquisicion: activo.valorAdquisicion.toString(),
      fechaAlta: activo.fechaAlta,
      valorResidual: activo.valorResidual.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setActivos(activos.filter((activo) => activo.id !== id))
    toast({
      title: "Activo eliminado",
      description: "El activo se ha eliminado correctamente.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Activos</h1>
          <p className="text-muted-foreground">Administra todos los activos fijos de tus clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Activo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingActivo ? "Editar Activo" : "Nuevo Activo"}</DialogTitle>
                <DialogDescription>Ingresa los datos del activo fijo</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Cliente</Label>
                      <Select
                        value={formData.cliente}
                        onValueChange={(value) => setFormData({ ...formData, cliente: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente} value={cliente}>
                              {cliente}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valorAdquisicion">Valor de Adquisición</Label>
                      <Input
                        id="valorAdquisicion"
                        type="number"
                        step="0.01"
                        value={formData.valorAdquisicion}
                        onChange={(e) => setFormData({ ...formData, valorAdquisicion: e.target.value })}
                        placeholder="1000.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valorResidual">Valor Residual</Label>
                      <Input
                        id="valorResidual"
                        type="number"
                        step="0.01"
                        value={formData.valorResidual}
                        onChange={(e) => setFormData({ ...formData, valorResidual: e.target.value })}
                        placeholder="100.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaAlta">Fecha de Alta</Label>
                    <Input
                      id="fechaAlta"
                      type="date"
                      value={formData.fechaAlta}
                      onChange={(e) => setFormData({ ...formData, fechaAlta: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingActivo ? "Actualizar" : "Crear"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Activos</CardTitle>
          <CardDescription>{activos.length} activos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Adquisición</TableHead>
                <TableHead>Fecha Alta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activos.map((activo) => (
                <TableRow key={activo.id}>
                  <TableCell className="font-medium">{activo.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{activo.categoria}</Badge>
                  </TableCell>
                  <TableCell>{activo.cliente}</TableCell>
                  <TableCell>${activo.valorAdquisicion.toLocaleString()}</TableCell>
                  <TableCell>{new Date(activo.fechaAlta).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(activo)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(activo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
