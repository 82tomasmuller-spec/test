import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { incidentsApi } from '../services/api';
import type { User, Incident } from '../types';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  user: User;
}

export default function Incidents({ user }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'resolved'>('all');

  useEffect(() => {
    loadIncidents();
  }, [filter]);

  const loadIncidents = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : undefined;
      const response = await incidentsApi.getAll(params);
      setIncidents(response.data);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await incidentsApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'incidents.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting incidents:', error);
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 1000 / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="text-center py-12">Načítání...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incidenty</h1>
            <p className="mt-2 text-gray-600">Historie výpadků a incidentů</p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vše
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'ongoing'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Probíhající
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'resolved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vyřešené
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {incidents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {filter === 'all'
                ? 'Žádné incidenty. Skvělá práce!'
                : `Žádné ${filter === 'ongoing' ? 'probíhající' : 'vyřešené'} incidenty.`}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {incidents.map((incident: any) => (
                <li key={incident.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      {incident.status === 'ongoing' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {incident.monitor?.url || 'Unknown URL'}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            incident.status === 'ongoing'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {incident.status === 'ongoing' ? 'PROBÍHÁ' : 'VYŘEŠENO'}
                        </span>
                      </div>
                      {incident.monitor?.shop && (
                        <p className="text-sm text-gray-600 mt-1">
                          Shop: {incident.monitor.shop.name}
                        </p>
                      )}
                      {incident.errorMessage && (
                        <p className="text-sm text-red-600 mt-2">
                          Chyba: {incident.errorMessage}
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Začátek:</span>{' '}
                          {format(new Date(incident.startedAt), 'dd.MM.yyyy HH:mm:ss')}
                        </div>
                        {incident.resolvedAt && (
                          <div>
                            <span className="font-medium">Konec:</span>{' '}
                            {format(new Date(incident.resolvedAt), 'dd.MM.yyyy HH:mm:ss')}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Trvání:</span>{' '}
                          {formatDuration(incident.startedAt, incident.resolvedAt)}
                        </div>
                        {incident.httpCode && (
                          <div>
                            <span className="font-medium">HTTP kód:</span> {incident.httpCode}
                          </div>
                        )}
                        {incident.responseTime && (
                          <div>
                            <span className="font-medium">Odezva:</span> {incident.responseTime}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
