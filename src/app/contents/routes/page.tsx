// src/app/contents/routes/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, PlusCircle, Loader2, AlertCircle, GripVertical, ArrowDown, ArrowUp } from 'lucide-react';
import Image from 'next/image';

interface ARResource {
    uuid: string;
    name: string;
    type: 'image' | 'video' | '3d-model';
    qr_code_url: string;
}

interface ARRoute {
    uuid: string;
    name: string;
    description: string;
    qr_code_url: string;
    step_count: number;
    created_at: string;
}

const API_URL = 'http://localhost:5000';

export default function RoutesPage() {
    const [routes, setRoutes] = useState<ARRoute[]>([]);
    const [resources, setResources] = useState<ARResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // State for new route creation
    const [newRouteName, setNewRouteName] = useState('');
    const [newRouteDescription, setNewRouteDescription] = useState('');
    const [selectedResources, setSelectedResources] = useState<ARResource[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [routesRes, resourcesRes] = await Promise.all([
                fetch(`${API_URL}/api/routes`),
                fetch(`${API_URL}/api/resources`)
            ]);
            if (!routesRes.ok || !resourcesRes.ok) throw new Error('Network response was not ok');
            const routesData = await routesRes.json();
            const resourcesData = await resourcesRes.json();
            setRoutes(routesData);
            setResources(resourcesData);
        } catch (err) {
            setError('Failed to fetch data. Make sure the backend server is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleResourceSelect = (resource: ARResource, checked: boolean) => {
        setSelectedResources(prev => {
            if (checked) {
                // Add if not already present
                if (!prev.find(r => r.uuid === resource.uuid)) {
                    return [...prev, resource];
                }
            } else {
                // Remove
                return prev.filter(r => r.uuid !== resource.uuid);
            }
            return prev;
        });
    };
    
    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newSteps = [...selectedResources];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;
        
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]; // Swap
        setSelectedResources(newSteps);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newRouteName || selectedResources.length === 0) {
            alert('Please provide a name and select at least one step.');
            return;
        }

        setIsSubmitting(true);
        const routeData = {
            name: newRouteName,
            description: newRouteDescription,
            steps: selectedResources.map((res, index) => ({
                resource_uuid: res.uuid,
                step_order: index
            }))
        };

        try {
            const response = await fetch(`${API_URL}/api/routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(routeData),
            });

            if (!response.ok) throw new Error('Failed to create route');

            fetchData();
            setIsDialogOpen(false);
            setNewRouteName('');
            setNewRouteDescription('');
            setSelectedResources([]);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteRoute = async (uuid: string) => {
        if (!confirm('Are you sure you want to delete this route? This action is permanent.')) return;
        try {
            const response = await fetch(`${API_URL}/api/routes/${uuid}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete route');
            fetchData();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>AR Route Management</CardTitle>
                    <CardDescription>Create and manage ordered AR experiences like scavenger hunts or guided tours.</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Route</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl grid-rows-[auto,1fr,auto]">
                        <DialogHeader>
                            <DialogTitle>Create New AR Route</DialogTitle>
                            <DialogDescription>Define a sequence of AR resources to create a guided experience.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 overflow-y-auto py-4">
                            {/* Left Column: Details & Steps */}
                            <div className="flex flex-col gap-4">
                                <div>
                                    <Label htmlFor="routeName">Route Name</Label>
                                    <Input id="routeName" value={newRouteName} onChange={e => setNewRouteName(e.target.value)} placeholder="e.g., 'Campus Art Tour'" required />
                                </div>
                                <div>
                                    <Label htmlFor="routeDescription">Description</Label>
                                    <Textarea id="routeDescription" value={newRouteDescription} onChange={e => setNewRouteDescription(e.target.value)} placeholder="A short description of the route." />
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-semibold mb-2">Route Steps</h3>
                                    <Card className="min-h-[200px]">
                                        <CardContent className="p-2">
                                            {selectedResources.length === 0 ? (
                                                <p className="text-muted-foreground text-center p-8">Select resources from the list to add them as steps.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedResources.map((res, index) => (
                                                        <div key={res.uuid} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                            <span className="font-mono text-sm text-muted-foreground">{index + 1}</span>
                                                            <Image src={`${API_URL}${res.qr_code_url}`} width={24} height={24} alt={res.name} className="rounded-sm" />
                                                            <span className="flex-1 font-medium text-sm truncate">{res.name}</span>
                                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'down')} disabled={index === selectedResources.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                            {/* Right Column: Available Resources */}
                            <div>
                                <h3 className="font-semibold mb-2">Available Resources</h3>
                                 <Card>
                                    <ScrollArea className="h-[450px]">
                                        <div className="p-2 space-y-2">
                                            {resources.map(res => (
                                                <div key={res.uuid} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                                    <Checkbox 
                                                        id={`res-${res.uuid}`} 
                                                        checked={!!selectedResources.find(r => r.uuid === res.uuid)}
                                                        onCheckedChange={checked => handleResourceSelect(res, !!checked)}
                                                    />
                                                    <Label htmlFor={`res-${res.uuid}`} className="flex-1 flex items-center gap-2 cursor-pointer">
                                                        <Image src={`${API_URL}${res.qr_code_url}`} width={32} height={32} alt={res.name} className="rounded-sm border p-0.5" />
                                                        <div>
                                                            <p className="font-medium">{res.name}</p>
                                                            <p className="text-xs text-muted-foreground capitalize">{res.type.replace('-', ' ')}</p>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                 </Card>
                            </div>
                        </form>
                        <DialogFooter>
                            <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Route
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : error ? (
                    <div className="text-red-500 flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-4">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p className="font-semibold">An Error Occurred</p><p>{error}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Try Again</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>QR Code</TableHead>
                                <TableHead>Route Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Steps</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {routes.map(route => (
                                <TableRow key={route.uuid}>
                                    <TableCell>
                                        <div className="p-1 border rounded-md w-14 h-14 flex items-center justify-center">
                                            <Image src={`${API_URL}${route.qr_code_url}`} alt={`QR for ${route.name}`} width={48} height={48} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{route.name}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-sm truncate">{route.description || 'No description'}</TableCell>
                                    <TableCell className="text-center">{route.step_count}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => deleteRoute(route.uuid)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!loading && !error && routes.length === 0 && (
                    <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
                        No routes found. Click "Add Route" to create your first scavenger hunt or tour.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
