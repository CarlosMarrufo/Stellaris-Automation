import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Building2, Search, ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoBadgeClass = {
  pendiente:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  aceptada:   'bg-green-100 text-green-800 border-green-200',
  rechazada:  'bg-red-100 text-red-800 border-red-200',
  modificada: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function CotizacionesAdminTab() {
  const queryClient = useQueryClient();
  const [filterEstado,  setFilterEstado]  = useState('todos');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [searchText,    setSearchText]    = useState('');
  const [expandedId,    setExpandedId]    = useState(null);
  const [editNotas,     setEditNotas]     = useState({});

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['admin-cotizaciones'],
    queryFn: async () => {
      const res = await fetch('/api/admin/cotizaciones', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar cotizaciones');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, estado, notas }) => {
      const res = await fetch(`/api/admin/cotizaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado, notas }),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-cotizaciones'] }),
  });

  // Unique clients for filter
  const clientes = [...new Map(
    cotizaciones.filter((c) => c.idCliente).map((c) => [c.idCliente, c.cliente])
  ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const search = searchText.toLowerCase().trim();
  const filtered = cotizaciones
    .filter((c) => filterEstado  === 'todos' || c.estado === filterEstado)
    .filter((c) => filterCliente === 'todos' || String(c.idCliente) === filterCliente)
    .filter((c) => !search || c.folio.toLowerCase().includes(search)
                           || c.cliente.toLowerCase().includes(search)
                           || c.solicitante.toLowerCase().includes(search));

  const totalMonto = cotizaciones.reduce((s, c) => s + c.total, 0);

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

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',       count: cotizaciones.length,                                         color: 'text-slate-900' },
          { label: 'Pendientes',  count: cotizaciones.filter((c) => c.estado === 'pendiente').length, color: 'text-yellow-600' },
          { label: 'Aceptadas',   count: cotizaciones.filter((c) => c.estado === 'aceptada').length,  color: 'text-green-600' },
          { label: 'Rechazadas',  count: cotizaciones.filter((c) => c.estado === 'rechazada').length, color: 'text-red-600' },
          { label: 'Modificadas', count: cotizaciones.filter((c) => c.estado === 'modificada').length, color: 'text-blue-600' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por folio, cliente, solicitante..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Cliente:</span>
          <Select value={filterCliente} onValueChange={setFilterCliente}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {clientes.map(([id, nombre]) => (
                <SelectItem key={id} value={String(id)}>{nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Estado:</span>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aceptada">Aceptada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
              <SelectItem value="modificada">Modificada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cotizaciones list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No hay cotizaciones que coincidan con los filtros seleccionados
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((cot) => {
            const isExpanded = expandedId === cot.id;
            const badgeClass = estadoBadgeClass[cot.estado] ?? 'bg-slate-100 text-slate-800 border-slate-200';
            const notasKey   = cot.id;
            const currentNotas = editNotas[notasKey] ?? cot.notas;

            return (
              <Card key={cot.id} className={`overflow-hidden transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
                {/* Collapsed row */}
                <button
                  className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : cot.id);
                    if (!isExpanded) setEditNotas((prev) => ({ ...prev, [cot.id]: cot.notas }));
                  }}
                >
                  <span className="font-mono font-semibold text-slate-900 text-sm flex-shrink-0">
                    {cot.folio}
                  </span>
                  <span className="hidden sm:block text-sm text-slate-500 flex-shrink-0">
                    {format(new Date(cot.fecha), 'dd/MMM/yy', { locale: es })}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600 flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                    {cot.cliente}
                  </span>
                  <span className="text-sm text-slate-500 truncate min-w-0 flex-1 hidden md:block">
                    {cot.solicitante}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 flex-shrink-0">
                    ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant="outline" className={`${badgeClass} border text-xs flex-shrink-0`}>
                    {cot.estado}
                  </Badge>
                  <span className="text-slate-400 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50">
                    {/* Info */}
                    <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Cliente</p>
                        <p className="font-medium text-slate-800">{cot.cliente}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Solicitante</p>
                        <p className="font-medium text-slate-800">{cot.solicitante}</p>
                        <p className="text-xs text-slate-400">{cot.correo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Fecha</p>
                        <p className="font-medium text-slate-800">
                          {format(new Date(cot.fecha), 'dd/MMM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Total</p>
                        <p className="font-bold text-slate-900 text-lg">
                          ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Items table */}
                    {cot.items.length > 0 && (
                      <div className="px-5 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Código</TableHead>
                              <TableHead className="text-xs">Descripción</TableHead>
                              <TableHead className="text-xs text-center">Cant.</TableHead>
                              <TableHead className="text-xs text-right">Precio</TableHead>
                              <TableHead className="text-xs text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cot.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                                <TableCell className="text-xs max-w-xs truncate">{item.descripcion}</TableCell>
                                <TableCell className="text-xs text-center">{item.cantidad}</TableCell>
                                <TableCell className="text-xs text-right">
                                  ${item.precioRef.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-xs text-right font-semibold">
                                  ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Actions: change estado + notas */}
                    <div className="px-5 py-4 border-t border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-slate-600">Estado:</span>
                        <Select
                          value={cot.estado}
                          onValueChange={(v) => updateMutation.mutate({ id: cot.id, estado: v, notas: currentNotas })}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="aceptada">Aceptada</SelectItem>
                            <SelectItem value="rechazada">Rechazada</SelectItem>
                            <SelectItem value="modificada">Modificada</SelectItem>
                          </SelectContent>
                        </Select>
                        {updateMutation.isPending && (
                          <span className="text-xs text-slate-400">Guardando...</span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-1">Notas admin</p>
                        <div className="flex gap-2">
                          <Textarea
                            value={currentNotas}
                            onChange={(e) => setEditNotas((prev) => ({ ...prev, [notasKey]: e.target.value }))}
                            rows={2}
                            className="flex-1 text-sm"
                            placeholder="Notas internas sobre esta cotización..."
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentNotas === cot.notas || updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: cot.id, estado: cot.estado, notas: currentNotas })}
                            className="flex-shrink-0 self-end"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            Guardar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">
        Mostrando {filtered.length} de {cotizaciones.length} cotizaciones
        {' — '}Monto total: ${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
