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
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Categoria {
  id: number
  nombre: string
  vidaUtil: number
  metodo: string
  valorResidual: number
}

export function CategoriasView() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: 1, nombre: "Equipos de Computación", vidaUtil: 3, metodo: "lineal", valorResidual: 0.1 },
    { id: 2, nombre: "Vehículos", vidaUtil: 5, metodo: "lineal", valorResidual: 0.2 },
    { id: 3, nombre: "Maquinaria", vidaUtil: 10, metodo: "decreciente", valorResidual: 0.15 },
    { id: 4, nombre: "Inmuebles", vidaUtil: 50, metodo: "lineal", valorResidual: 0.05 },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    vidaUtil: "",
    metodo: "",
    valorResidual: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newCategoria: Categoria = {
      id: editingCategoria ? editingCategoria.id : Date.now(),
      nombre: formData.nombre,
      vidaUtil: Number.parseInt(formData.vidaUtil),
      metodo: formData.metodo,
      valorResidual: Number.parseFloat(formData.valorResidual),
    }

    if (editingCategoria) {
      setCategorias(categorias.map((cat) => (cat.id === editingCategoria.id ? newCategoria : cat)))
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado correctamente.",
      })
    } else {
      setCategorias([...categorias, newCategoria])
      toast({
        title: "Categoría creada",
        description: "La nueva categoría se ha creado correctamente.",
      })
    }

    setIsDialogOpen(false)
    setEditingCategoria(null)
    setFormData({ nombre: "", vidaUtil: "", metodo: "", valorResidual: "" })
  }

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setFormData({
      nombre: categoria.nombre,
      vidaUtil: categoria.vidaUtil.toString(),
      metodo: categoria.metodo,
      valorResidual: categoria.valorResidual.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setCategorias(categorias.filter((cat) => cat.id !== id))
    toast({
      title: "Categoría eliminada",
      description: "La categoría se ha eliminado correctamente.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías de Activos</h1>
          <p className="text-muted-foreground">Gestiona las categorías y sus parámetros de amortización</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
              <DialogDescription>Define los parámetros de amortización para esta categoría</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Equipos de Computación"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vidaUtil">Vida Útil (años)</Label>
                  <Input
                    id="vidaUtil"
                    type="number"
                    value={formData.vidaUtil}
                    onChange={(e) => setFormData({ ...formData, vidaUtil: e.target.value })}
                    placeholder="Ej: 5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodo">Método de Amortización</Label>
                  <Select
                    value={formData.metodo}
                    onValueChange={(value) => setFormData({ ...formData, metodo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lineal">Lineal</SelectItem>
                      <SelectItem value="decreciente">Decreciente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorResidual">Valor Residual (%)</Label>
                  <Input
                    id="valorResidual"
                    type="number"
                    step="0.01"
                    value={formData.valorResidual}
                    onChange={(e) => setFormData({ ...formData, valorResidual: e.target.value })}
                    placeholder="Ej: 0.10"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingCategoria ? "Actualizar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>{categorias.length} categorías registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Vida Útil</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor Residual</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell>{categoria.vidaUtil} años</TableCell>
                  <TableCell>
                    <Badge variant={categoria.metodo === "lineal" ? "default" : "secondary"}>{categoria.metodo}</Badge>
                  </TableCell>
                  <TableCell>{(categoria.valorResidual * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(categoria)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(categoria.id)}>
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
