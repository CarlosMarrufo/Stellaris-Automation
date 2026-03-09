import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, ChevronDown, ChevronUp, Calendar, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_COLORS = {
  pendiente:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  aceptada:    'bg-green-100 text-green-800 border-green-200',
  rechazada:   'bg-red-100 text-red-800 border-red-200',
  modificada:  'bg-blue-100 text-blue-800 border-blue-200',
};

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  aceptada:   'Aceptada',
  rechazada:  'Rechazada',
  modificada: 'Modificada',
};

export default function CotizacionesAdminTab() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded]   = useState(null);
  const [editId, setEditId]       = useState(null);
  const [editEstado, setEditEstado] = useState('');
  const [editNotas, setEditNotas] = useState('');

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones-admin'],
    queryFn:  async () => {
      const res = await fetch('/api/cotizaciones', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar cotizaciones');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, estado, notas }) => {
      const res = await fetch(`/api/cotizaciones/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado, notas }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al actualizar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-admin'] });
      setEditId(null);
    },
    onError: (err) => alert(`Error: ${err.message}`),
  });

  const startEdit = (c) => {
    setEditId(c.id);
    setEditEstado(c.estado);
    setEditNotas(c.notas ?? '');
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = () => {
    updateMutation.mutate({ id: editId, estado: editEstado, notas: editNotas });
  };

  const counts = {
    total:     cotizaciones.length,
    pendiente: cotizaciones.filter((c) => c.estado === 'pendiente').length,
    aceptada:  cotizaciones.filter((c) => c.estado === 'aceptada').length,
    rechazada: cotizaciones.filter((c) => c.estado === 'rechazada').length,
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando cotizaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: counts.total,     color: 'text-slate-900' },
          { label: 'Pendientes',value: counts.pendiente, color: 'text-yellow-600' },
          { label: 'Aceptadas', value: counts.aceptada,  color: 'text-green-600' },
          { label: 'Rechazadas',value: counts.rechazada, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-sm text-slate-600 mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {cotizaciones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No hay cotizaciones registradas
            </CardContent>
          </Card>
        ) : (
          cotizaciones.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <span>COT-{String(c.id).padStart(5, '0')}</span>
                      <Badge variant="outline" className={`${ESTADO_COLORS[c.estado] ?? ''} border text-xs`}>
                        {ESTADO_LABELS[c.estado] ?? c.estado}
                      </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {c.cliente} — {c.correo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.creado ? format(new Date(c.creado), 'dd MMM yyyy HH:mm', { locale: es }) : 'N/D'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors mt-1"
                  >
                    {expanded === c.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </CardHeader>

              {expanded === c.id && (
                <CardContent className="pt-0 space-y-4">
                  {/* Items */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 pr-4 text-slate-500 font-medium">Código</th>
                          <th className="text-left py-2 pr-4 text-slate-500 font-medium">Descripción</th>
                          <th className="text-center py-2 pr-4 text-slate-500 font-medium">Cant.</th>
                          <th className="text-right py-2 text-slate-500 font-medium">Precio Ref.</th>
                          <th className="text-right py-2 text-slate-500 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 font-mono text-xs">{item.codigo}</td>
                            <td className="py-2 pr-4">{item.nombre}</td>
                            <td className="py-2 pr-4 text-center">{item.cantidad}</td>
                            <td className="py-2 text-right">
                              ${item.precioRef.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 text-right font-semibold">
                              ${(item.cantidad * item.precioRef).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="pt-3 text-right font-semibold text-slate-700">Total estimado:</td>
                          <td className="pt-3 text-right font-bold text-slate-900">
                            ${c.items.reduce((s, i) => s + i.cantidad * i.precioRef, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Notas existentes */}
                  {c.notas && editId !== c.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Notas:</p>
                      <p className="text-sm text-blue-900">{c.notas}</p>
                    </div>
                  )}

                  {/* Edit / Save area */}
                  {editId === c.id ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Estado</p>
                        <Select value={editEstado} onValueChange={setEditEstado}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="aceptada">Aceptada</SelectItem>
                            <SelectItem value="rechazada">Rechazada</SelectItem>
                            <SelectItem value="modificada">Modificada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Notas (opcional)</p>
                        <Textarea
                          value={editNotas}
                          onChange={(e) => setEditNotas(e.target.value)}
                          rows={3}
                          placeholder="Condiciones especiales, modificaciones al pedido, etc."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={cancelEdit} size="sm">Cancelar</Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={updateMutation.isPending}
                          onClick={saveEdit}
                        >
                          {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200">
                      <Button variant="outline" size="sm" onClick={() => startEdit(c)}>
                        Actualizar estado
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
