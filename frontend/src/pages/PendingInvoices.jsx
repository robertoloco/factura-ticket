import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const PendingInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  const fetchPendingInvoices = async () => {
    try {
      const response = await api.get('/api/invoices/pending');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (invoice, type) => {
    setSelectedInvoice(invoice);
    setModalType(type);
    setShowModal(true);
    setNotes('');
    setRejectionReason('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
    setModalType('');
  };

  const handleApprove = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    try {
      await api.post(`/api/invoices/${selectedInvoice.id}/approve`, {
        notes,
        items: selectedInvoice.items
      });

      alert('Factura aprobada y enviada al cliente');
      closeModal();
      fetchPendingInvoices();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al aprobar factura');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedInvoice || !rejectionReason.trim()) {
      alert('Por favor indica el motivo del rechazo');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/api/invoices/${selectedInvoice.id}/reject`, {
        reason: rejectionReason
      });

      alert('Solicitud rechazada');
      closeModal();
      fetchPendingInvoices();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al rechazar solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Solicitudes Pendientes
        </h1>

        {invoices.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin solicitudes pendientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay solicitudes de factura esperando tu aprobación.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Solicitud de {invoice.client.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(invoice.date).toLocaleString()}
                  </p>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                  {/* Client Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Datos del cliente:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">NIF:</span>
                        <span className="ml-2 font-medium">{invoice.client.nif}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 font-medium">{invoice.client.email}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Dirección:</span>
                        <span className="ml-2">{invoice.client.address}, {invoice.client.postalCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Image */}
                  {invoice.ticketImageUrl && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Imagen del ticket:</h4>
                      <img 
                        src={invoice.ticketImageUrl} 
                        alt="Ticket" 
                        className="max-w-full h-48 object-contain rounded border"
                      />
                    </div>
                  )}

                  {/* Invoice Details */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Detalles de la factura:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {invoice.items && invoice.items.length > 0 ? (
                        <ul className="space-y-1">
                          {invoice.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{item.description} x{item.quantity}</span>
                              <span className="font-medium">{item.totalPrice.toFixed(2)} €</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No hay items detectados</p>
                      )}
                      <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                        <span>TOTAL</span>
                        <span>{invoice.totalAmount.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    onClick={() => openModal(invoice, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => openModal(invoice, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Aprobar y Generar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'approve' ? 'Aprobar Factura' : 'Rechazar Solicitud'}
            </h2>

            {modalType === 'approve' ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Se generará la factura y se enviará automáticamente por email a <strong>{selectedInvoice.client.email}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Gracias por su compra"
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Indica el motivo del rechazo para que el cliente lo sepa:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: El ticket no corresponde a nuestra empresa"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={modalType === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-md text-white font-medium disabled:opacity-50 ${
                  modalType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Procesando...' : modalType === 'approve' ? 'Aprobar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PendingInvoices;
