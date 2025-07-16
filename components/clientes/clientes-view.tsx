"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Trash2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Cliente {
  id: number
  nombre: string
  rut: string
  email: string
  telefono: string
  activos: number
}

export function ClientesView() {
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: 1,
      nombre: "Empresa ABC S.A.",
      rut: "12.345.678-9",
      email: "contacto@empresaabc.com",
      telefono: "+56 9 1234 5678",
      activos: 15,
    },
    {
      id: 2,
      nombre: "Comercial XYZ Ltda.",
      rut: "98.765.432-1",
      email: "info@comercialxyz.cl",
      telefono: "+56 9 8765 4321",
      activos: 8,
    },
    {
      id: 3,
      nombre: "Servicios DEF S.R.L.",
      rut: "11.222.333-4",
      email: "admin@serviciosdef.com",
      telefono: "+56 9 1122 3344",
      activos: 22,
    },
    {
      id: 4,
      nombre: "Industrias GHI S.A.",
      rut: "55.666.777-8",
      email: "gerencia@industriasghi.cl",
      telefono: "+56 9 5566 7788",
      activos: 45,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newCliente: Cliente = {
      id: editingCliente ? editingCliente.id : Date.now(),
      nombre: formData.nombre,
      rut: formData.rut,
      email: formData.email,
      telefono: formData.telefono,
      activos: editingCliente ? editingCliente.activos : 0,
    }

    if (editingCliente) {
      setClientes(clientes.map((cliente) => (cliente.id === editingCliente.id ? newCliente : cliente)))
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado correctamente.",
      })
    } else {
      setClientes([...clientes, newCliente])
      toast({
        title: "Cliente creado",
        description: "El nuevo cliente se ha creado correctamente.",
      })
    }

    setIsDialogOpen(false)
    setEditingCliente(null)
    setFormData({ nombre: "", rut: "", email: "", telefono: "" })
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre,
      rut: cliente.rut,
      email: cliente.email,
      telefono: cliente.telefono,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setClientes(clientes.filter((cliente) => cliente.id !== id))
    toast({
      title: "Cliente eliminado",
      description: "El cliente se ha eliminado correctamente.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra la información de tus clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCliente ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
              <DialogDescription>Ingresa los datos del cliente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre / Razón Social</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Empresa ABC S.A."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    placeholder="12.345.678-9"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingCliente ? "Actualizar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">Clientes activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos Totales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.reduce((sum, cliente) => sum + cliente.activos, 0)}</div>
            <p className="text-xs text-muted-foreground">Activos gestionados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>{clientes.length} clientes registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Activos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>{cliente.rut}</TableCell>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cliente.activos}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cliente.id)}>
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
