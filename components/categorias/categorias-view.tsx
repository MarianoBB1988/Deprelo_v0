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
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

const CategoriasView: React.FC = () => {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  })

  // Cargar categorías desde la API
  const cargarCategorias = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categorias')
      const result = await response.json()
      
      if (result.success) {
        setCategorias(result.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias()
  }, [])

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const datos = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
      }

      if (editingCategoria) {
        // Actualizar categoría existente
        const response = await fetch(`/api/categorias/${editingCategoria.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Categoría actualizada",
            description: "La categoría se ha actualizado correctamente.",
          })
          await cargarCategorias()
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo actualizar la categoría",
            variant: "destructive",
          })
        }
      } else {
        // Crear nueva categoría
        const response = await fetch('/api/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Categoría creada",
            description: "La nueva categoría se ha creado correctamente.",
          })
          await cargarCategorias()
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo crear la categoría",
            variant: "destructive",
          })
        }
      }

      setIsDialogOpen(false)
      setEditingCategoria(null)
      setFormData({ nombre: "", descripcion: "" })
    } catch (error) {
      console.error('Error enviando formulario:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Categoría eliminada",
          description: "La categoría se ha eliminado correctamente.",
        })
        await cargarCategorias()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar la categoría",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error)
      toast({
        title: "Error",
        description: "Error de conexión con el servidor",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "" })
    setEditingCategoria(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando categorías...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías de Activos</h1>
          <p className="text-muted-foreground">Gestiona las categorías de activos. Los parámetros de amortización se configuran anualmente en "Parámetros Anuales"</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
              <DialogDescription>Define la información básica para esta categoría. Los parámetros de amortización se configuran en "Parámetros Anuales"</DialogDescription>
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
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción de la categoría"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategoria ? "Actualizar" : "Crear"} Categoría
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorías Registradas</CardTitle>
          <CardDescription>Lista de todas las categorías de activos. Para configurar parámetros de amortización, ve a "Parámetros Anuales"</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
               
               
              
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
               
                
                 
                  <TableCell>{categoria.descripcion || "Sin descripción"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(categoria)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(categoria.id)}>
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

export default CategoriasView
