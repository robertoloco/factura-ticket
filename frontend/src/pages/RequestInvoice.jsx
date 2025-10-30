import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';

const RequestInvoice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Upload, 2: OCR Processing, 3: Confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketImage, setTicketImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [clientData, setClientData] = useState({
    nif: user?.nif || '',
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    postalCode: user?.postalCode || '',
    phone: user?.phone || '',
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTicketImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleOCR = async () => {
    if (!ticketImage) {
      setError('Por favor selecciona una imagen del ticket');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', ticketImage);

      const response = await api.post('/api/invoices/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setOcrData(response.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleClientDataChange = (e) => {
    setClientData({
      ...clientData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('ticketImage', ticketImage);
      formData.append('clientData', JSON.stringify(clientData));

      const response = await api.post('/api/invoices/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(response.data.message);
      navigate('/my-requests');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Solicitar Factura
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Subir Ticket</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Procesar</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmar</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Upload Ticket */}
        {step === 1 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">1. Sube la foto del ticket</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto del ticket
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {imagePreview && (
              <div className="mb-6">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-md mx-auto rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleOCR}
                disabled={!ticketImage || loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Continuar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Data */}
        {step === 3 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">3. Confirma los datos</h2>

            {ocrData && (
              <div className="mb-6 bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Datos extraídos del ticket:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Empresa:</span> {ocrData.companyName || 'No detectado'}
                  </div>
                  <div>
                    <span className="font-medium">NIF Empresa:</span> {ocrData.companyNif || 'No detectado'}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {ocrData.date || 'No detectada'}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> {ocrData.amount ? `${ocrData.amount.toFixed(2)} €` : 'No detectado'}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold">Tus datos (cliente):</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIF</label>
                  <input
                    type="text"
                    name="nif"
                    value={clientData.nif}
                    onChange={handleClientDataChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={clientData.name}
                    onChange={handleClientDataChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={clientData.email}
                    onChange={handleClientDataChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={clientData.phone}
                    onChange={handleClientDataChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input
                    type="text"
                    name="address"
                    value={clientData.address}
                    onChange={handleClientDataChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={clientData.postalCode}
                    onChange={handleClientDataChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Solicitar Factura'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RequestInvoice;
