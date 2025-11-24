// src/app/contents/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Loader2, AlertCircle, Edit } from 'lucide-react';
import Image from 'next/image';

// Definir el tipo para los recursos, basado en la API
interface ARResource {
    uuid: string;
    name: string;
    type: 'image' | 'video' | '3d-model';
    marker_type: 'pattern' | 'qrcode' | 'aruco';
    marker_data?: string | null;
    content_url: string;
    qr_code_url: string;
    access_count: number;
    last_accessed: string | null;
}

import { config } from '@/lib/config';
const API_URL = config.apiUrl;

export default function ContentsPage() {
    const [resources, setResources] = useState<ARResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<ARResource | null>(null);
    const [newResource, setNewResource] = useState({ 
        name: '', 
        type: 'video' as 'video' | 'image' | '3d-model', 
        markerType: 'qrcode' as 'pattern' | 'qrcode' | 'aruco',
        markerData: '' 
    });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/resources`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setResources(data);
        } catch (err) {
            setError('Failed to fetch resources. Make sure the backend server is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        // Validación de datos
        if (!editingResource && !file) {
            setError('Por favor, selecciona un archivo.');
            return;
        }
        
        if (!newResource.name || newResource.name.trim().length === 0) {
            setError('Por favor, ingresa un nombre para el recurso.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('name', newResource.name.trim());
        formData.append('type', newResource.type);
        formData.append('markerType', newResource.markerType || 'qrcode');
        if (newResource.markerData) {
            formData.append('markerData', newResource.markerData);
        }
        if (file) {
            formData.append('content', file);
        }

        try {
            const url = editingResource 
                ? `${API_URL}/api/resources/${editingResource.uuid}`
                : `${API_URL}/api/resources`;
            
            const response = await fetch(url, {
                method: editingResource ? 'PUT' : 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || data.details || `Error al ${editingResource ? 'actualizar' : 'crear'} el recurso`;
                const errorDetails = data.details ? `\n\nDetalles: ${data.details}` : '';
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            // Éxito
            fetchResources(); // Recargar la lista
            resetForm(); // Resetear formulario
        } catch (err: any) {
            const errorMessage = err.message || `Error desconocido al ${editingResource ? 'actualizar' : 'crear'} el recurso`;
            setError(errorMessage);
            console.error(`Error ${editingResource ? 'updating' : 'creating'} resource:`, err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsDialogOpen(false);
        setEditingResource(null);
        setNewResource({ name: '', type: 'video', markerType: 'qrcode', markerData: '' });
        setFile(null);
        setError(null);
    };

    const handleEdit = (resource: ARResource) => {
        setEditingResource(resource);
        setNewResource({
            name: resource.name,
            type: resource.type,
            markerType: resource.marker_type,
            markerData: (resource as any).marker_data || ''
        });
        setFile(null);
        setIsDialogOpen(true);
    };
    
    const deleteResource = async (uuid: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            const response = await fetch(`${API_URL}/api/resources/${uuid}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete resource');
            }
            fetchResources();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>AR Resource Management</CardTitle>
                    <CardDescription>View, add, and manage your individual AR assets.</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingResource ? 'Edit AR Resource' : 'Add New AR Resource'}</DialogTitle>
                            <DialogDescription>
                                {editingResource 
                                    ? 'Update the resource information. Leave file empty to keep the current file.'
                                    : 'Upload a new asset to be used in an AR experience.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                    <AlertCircle className="inline h-4 w-4 mr-2" />
                                    {error}
                                </div>
                            )}
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Nombre *</Label>
                                    <Input 
                                        id="name" 
                                        value={newResource.name} 
                                        onChange={(e) => {
                                            setNewResource({...newResource, name: e.target.value});
                                            setError(null);
                                        }} 
                                        className="col-span-3" 
                                        placeholder="Ej: Video Corporativo" 
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">Tipo *</Label>
                                    <Select value={newResource.type} onValueChange={(value: 'image' | 'video' | '3d-model') => setNewResource({...newResource, type: value })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecciona el tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="image">Imagen</SelectItem>
                                            <SelectItem value="3d-model">Modelo 3D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="markerType" className="text-right">Marcador</Label>
                                    <Select value={newResource.markerType} onValueChange={(value: 'pattern' | 'qrcode' | 'aruco') => setNewResource({...newResource, markerType: value })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Tipo de marcador" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="qrcode">QR Code</SelectItem>
                                            <SelectItem value="pattern">Pattern</SelectItem>
                                            <SelectItem value="aruco">ArUco</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="markerData" className="text-right">Datos del Marcador</Label>
                                    <Input 
                                        id="markerData" 
                                        value={newResource.markerData}
                                        onChange={(e) => {
                                            setNewResource({...newResource, markerData: e.target.value});
                                            setError(null);
                                        }}
                                        className="col-span-3" 
                                        placeholder="Opcional: datos adicionales del marcador"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="content" className="text-right">Archivo {!editingResource && '*'}</Label>
                                    <Input 
                                        id="content" 
                                        type="file" 
                                        onChange={(e) => {
                                            handleFileChange(e);
                                            setError(null);
                                        }} 
                                        className="col-span-3" 
                                        required={!editingResource}
                                        accept=".jpg,.jpeg,.png,.mp4,.webm,.mov,.avi,.ogg,.glb,.gltf"
                                    />
                                    {editingResource && (
                                        <p className="col-span-3 col-start-2 text-xs text-muted-foreground">
                                            Deja vacío para mantener el archivo actual
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingResource ? 'Actualizar' : 'Crear'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                     <div className="text-red-500 flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-4">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p className="font-semibold">An Error Occurred</p>
                        <p>{error}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={fetchResources}>Try Again</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>QR Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-center">Access Count</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resources.map((resource) => (
                                <TableRow key={resource.uuid}>
                                    <TableCell>
                                        <div className="p-1 border rounded-md w-14 h-14 flex items-center justify-center">
                                            <Image src={`${API_URL}${resource.qr_code_url}`} alt={`QR for ${resource.name}`} width={48} height={48} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{resource.name}</TableCell>
                                    <TableCell><span className="capitalize bg-muted px-2 py-1 rounded-full text-xs font-medium">{resource.type.replace('-',' ')}</span></TableCell>
                                    <TableCell className="text-center">{resource.access_count}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteResource(resource.uuid)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 { !loading && !error && resources.length === 0 && (
                    <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
                        No resources found. Click "Add Resource" to get started.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
