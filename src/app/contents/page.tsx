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
import { Trash2, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/ar-explorer/header';
import Image from 'next/image';

// Definir el tipo para los recursos, basado en la API
interface ARResource {
    uuid: string;
    name: string;
    type: 'image' | 'video' | '3d-model';
    marker_type: 'pattern' | 'qrcode' | 'aruco';
    content_url: string;
    qr_code_url: string;
    access_count: number;
    last_accessed: string | null;
}

const API_URL = 'http://localhost:5000';

export default function ContentsPage() {
    const [resources, setResources] = useState<ARResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newResource, setNewResource] = useState({ name: '', type: 'video' as 'video' | 'image' | '3d-model', markerType: 'qrcode' as 'pattern' | 'qrcode' | 'aruco' });
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
        if (!file || !newResource.name) {
            alert('Please fill all fields and select a file.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', newResource.name);
        formData.append('type', newResource.type);
        formData.append('markerType', newResource.markerType);
        formData.append('content', file);

        try {
            const response = await fetch(`${API_URL}/api/resources`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create resource');
            }

            await response.json();
            fetchResources(); // Recargar la lista
            setIsDialogOpen(false); // Cerrar el diálogo
            setNewResource({ name: '', type: 'video', markerType: 'qrcode' }); // Resetear formulario
            setFile(null);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="flex h-svh w-full flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>AR Resource Management</CardTitle>
                            <CardDescription>View, add, and manage your AR assets.</CardDescription>
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
                                    <DialogTitle>Add New AR Resource</DialogTitle>
                                    <DialogDescription>
                                        Upload a new asset to be used in the AR experience.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right">Name</Label>
                                            <Input id="name" value={newResource.name} onChange={(e) => setNewResource({...newResource, name: e.target.value})} className="col-span-3" placeholder="e.g., 'Corporate Video'" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="type" className="text-right">Type</Label>
                                            <Select value={newResource.type} onValueChange={(value: 'image' | 'video' | '3d-model') => setNewResource({...newResource, type: value })}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    <SelectItem value="3d-model">3D Model</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="content" className="text-right">File</Label>
                                            <Input id="content" type="file" onChange={handleFileChange} className="col-span-3" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create
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
                                                <Button variant="ghost" size="icon" onClick={() => deleteResource(resource.uuid)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
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
            </main>
        </div>
    );
}
