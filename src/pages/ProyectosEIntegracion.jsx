import React from 'react';
import { Package, Clock, Lightbulb } from 'lucide-react';
import ServiceCard from '../components/shared/ServiceCard';
import puzzleRobot from '../utils/puzzle_robot.png';

export default function SuministroRefacciones() {
  const services = [
    {
      title: 'Proyecto llave en mano',
      problem: 'Procesos manuales o semiautomatizados con variabilidad, baja repetibilidad o limitaciones de capacidad productiva que requieren una solución estructurada de automatización robótica.',
      includes: [
        'Evaluación técnica y levantamiento en planta',
        'Ingeniería conceptual y diseño de celda',
        'Selección e integración de robot y periféricos',
        'Integración mecánica y eléctrica',
        'Programación y validación de proceso',
        'Puesta en marcha productiva'
      ],
      differentiator: 'Proyectos estructurados con enfoque en estabilidad operativa y escalabilidad futura, no solo instalación básica.',
      idealClient: 'Empresas que buscan automatizar un proceso nuevo o reemplazar operación manual por celda robotizada.',
      criticality: 'Estratégica',
      model: 'Proyecto por alcance definido con ingeniería conceptual previa y propuesta técnica detallada.'
    },
    {
      title: 'Integración y Retrofit de Celda',
      problem: 'Celdas operativas con tecnología obsoleta, robots descontinuados o integración limitada que afecta confiabilidad y soporte futuro',
      includes: [
        'Evaluación técnica de celda actual',
        'Sustitución o actualización de robot',
        'Migración de controlador',
        'Reconfiguración eléctrica y mecánic',
        'Reprogramación y validación completa',
        'Arranque técnico supervisado',
      ],
      differentiator: 'Modernización estratégica que extiende la vida útil de la celda sin necesidad de reemplazo total.',
      idealClient: 'Plantas con robots antiguos, soporte limitado o necesidad de actualizar tecnología sin rediseñar toda la línea.',
      criticality: 'Alta',
      model: 'Proyecto por modernización parcial con análisis técnico previo y propuesta escalonada.'
    },
    {
      title: 'Optimización de Proceso y Programación',
      problem: 'Celdas operativas con tiempos de ciclo elevados, inestabilidad de proceso o bajo aprovechamiento del robot instalado.',
      includes: [
        'Análisis técnico de desempeño actual',
        'Reprogramación y mejora de trayectorias',
        'Optimización de tiempos de ciclo',
        'Ajuste fino de parámetros de proceso',
        'Evaluación de carga y desempeño por eje',
        'Reporte técnico con mejoras implementadas',
      ],
      differentiator: 'Enfoque técnico basado en mejora medible de desempeño, no solo ajustes superficiales.',
      idealClient: 'Empresas que ya cuentan con robot pero desean mejorar productividad sin inversión en nueva celda.',
      criticality: 'Media',
      model: 'Servicio técnico especializado con alcance definido según análisis inicial.'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <img src={puzzleRobot} alt="Stellaris" className="w-8 h-8 object-contain" />
            </div>
            <div className="text-sm font-semibold text-yellow-100 uppercase tracking-wide">INGENIERÍA E INTEGRACIÓN</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl">
            Proyectos, Integración y Optimización
          </h1>
          
          <p className="text-xl text-orange-100 leading-relaxed max-w-3xl">
            Diseñamos, integramos y optimizamos soluciones de automatización robótica.
          </p>
          
          <p className="text-xl text-orange-100 leading-relaxed max-w-3xl mb-8">
            Desde nuevos proyectos llave en mano hasta mejoras técnicas en celdas existentes para aumentar productividad y estabilidad del proceso.
          </p>

          <div className="flex items-center space-x-3 bg-white/20 border border-white/30 rounded-xl p-4 max-w-2xl">
            <Lightbulb className="w-6 h-6 text-yellow-200 flex-shrink-0" />
            <p className="text-white text-sm">
              <strong>Enfoque integral:</strong>Incluye análisis técnico, reprogramación, optimización de ciclo, integración mecánica y eléctrica, actualización de robot y acompañamiento post-arranque.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} color="orange" />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Necesita una refacción crítica?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Consulte disponibilidad con nuestro equipo técnico. Si está en inventario, puede estar en su planta en 24-48 horas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:ventas@stellarisautomation.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all font-semibold shadow-lg"
            >
              Consultar Disponibilidad
            </a>
            <a
              href="tel:+528183519650"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-50 transition-all font-semibold border-2 border-slate-300"
            >
              Llamar: (81) 8351-9650
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}