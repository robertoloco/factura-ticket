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
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [companyResults, setCompanyResults] = useState([]);
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

  const searchCompanies = async (query) => {
    if (query.length < 2) {
      setCompanyResults([]);
      return;
    }

    try {
      const response = await api.get(`/api/companies/search?q=${encodeURIComponent(query)}`);
      setCompanyResults(response.data);
    } catch (err) {
      console.error('Error searching companies:', err);
    }
  };

  const handleCompanySearch = (e) => {
    const query = e.target.value;
    setCompanySearch(query);
    searchCompanies(query);
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setCompanySearch(company.name);
    setCompanyResults([]);
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
      
      // Si el OCR detectó nombre de empresa, pre-buscar
      if (response.data.companyName) {
        setCompanySearch(response.data.companyName);
        await searchCompanies(response.data.companyName);
      }
      
      setStep(2);
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
    if (!selectedCompany) {
      setError('Por favor selecciona una empresa');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('ticketImage', ticketImage);
      formData.append('companyId', selectedCompany.id);
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
              <span className="ml-2 font-medium">Seleccionar Empresa</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmar Datos</span>
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

        {/* Step 2: Select Company */}
        {step === 2 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">2. Selecciona la empresa</h2>

            {ocrData && ocrData.companyName && (
              <div className="mb-4 bg-blue-50 p-3 rounded text-sm">
                <span className="font-medium">Empresa detectada en el ticket:</span> {ocrData.companyName}
              </div>
            )}

            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar empresa
              </label>
              <input
                type="text"
                value={companySearch}
                onChange={handleCompanySearch}
                placeholder="Escribe el nombre de la empresa..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Results dropdown */}
              {companyResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {companyResults.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => selectCompany(company)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">NIF: {company.nif}</div>
                      <div className="text-xs text-gray-400">{company.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCompany && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800 mb-2">✓ Empresa seleccionada:</h3>
                <div className="text-sm">
                  <div><strong>{selectedCompany.name}</strong></div>
                  <div>NIF: {selectedCompany.nif}</div>
                  <div>{selectedCompany.address}</div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Volver
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedCompany}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Data */}
        {step === 3 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">3. Confirma los datos</h2>

            {selectedCompany && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800 mb-2">✓ Factura solicitada a:</h3>
                <div className="text-sm">
                  <div><strong>{selectedCompany.name}</strong></div>
                  <div>NIF: {selectedCompany.nif}</div>
                </div>
              </div>
            )}

            {ocrData && (
              <div className="mb-6 bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Datos del ticket:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
