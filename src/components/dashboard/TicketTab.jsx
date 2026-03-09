import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Send } from 'lucide-react';

export default function TicketTab() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    idRobot: '',
    tipo_servicio: '',
    prioridad: 'media',
    descripcion: '',
    fecha_programada: ''
  });

  const { data: robots = [] } = useQuery({
    queryKey: ['robots'],
    queryFn: async () => {
      const res = await fetch('/api/robots', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar robots');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, idRobot: Number(data.idRobot) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al crear el ticket');
      }
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setFormData({
        idRobot: '',
        tipo_servicio: '',
        prioridad: 'media',
        descripcion: '',
        fecha_programada: ''
      });
      alert(`Ticket ${result.numero_ticket} creado exitosamente`);
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Crear Nuevo Ticket de Servicio</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Robot (Número de Serie)</Label>
                <Select
                  value={formData.idRobot}
                  onValueChange={(value) => setFormData({...formData, idRobot: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar robot" />
                  </SelectTrigger>
                  <SelectContent>
                    {robots.map((robot) => (
                      <SelectItem key={robot.id} value={String(robot.id)}>
                        {robot.marca} {robot.modelo} — {robot.numero_serie_robot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Servicio</Label>
                <Select
                  value={formData.tipo_servicio}
                  onValueChange={(value) => setFormData({...formData, tipo_servicio: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Mantenimiento Preventivo</SelectItem>
                    <SelectItem value="correctivo_urgente">Mantenimiento Correctivo</SelectItem>
                    <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                    <SelectItem value="post_colision">Post-Colisión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value) => setFormData({...formData, prioridad: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fecha Programada (Opcional)</Label>
                <Input
                  type="date"
                  value={formData.fecha_programada}
                  onChange={(e) => setFormData({...formData, fecha_programada: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Descripción del Problema o Servicio</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describa detalladamente el problema o servicio requerido..."
                rows={6}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {createTicketMutation.isPending ? (
                'Creando ticket...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Crear Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> Una vez creado el ticket, nuestro equipo técnico será notificado y se pondrá en contacto con usted para coordinar el servicio.
        </p>
      </div>
    </div>
  );
}