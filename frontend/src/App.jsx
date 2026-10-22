import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import AppRoutes from './routes/AppRoutes';

import { resumenService } from './services/resumenService';
import { facturaService } from './services/facturaService';
import { clienteService } from './services/clienteService';
import { productoService } from './services/productoService';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [healthOk, setHealthOk] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Tema de oficina elegante (por defecto claro ejecutivo)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('facturapyme_theme') || 'office-light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('facturapyme_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'office-light' ? 'office-dark' : 'office-light'));
  };

  // Estados de datos
  const [resumenData, setResumenData] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(true);

  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  // Estados de detalle / modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [isSubmittingFactura, setIsSubmittingFactura] = useState(false);

  // Sistema de Toast
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Carga de datos centralizada
  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Health check
      try {
        await resumenService.getHealth();
        setHealthOk(true);
      } catch {
        setHealthOk(false);
      }

      // 2. Resumen
      try {
        const resumen = await resumenService.getMetricas();
        setResumenData(resumen);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      } finally {
        setLoadingResumen(false);
      }

      // 3. Facturas
      try {
        const factList = await facturaService.getAll();
        setFacturas(factList);
      } catch (err) {
        console.error('Error cargando facturas:', err);
      } finally {
        setLoadingFacturas(false);
      }

      // 4. Clientes
      try {
        const cliList = await clienteService.getAll();
        setClientes(cliList);
      } catch (err) {
        console.error('Error cargando clientes:', err);
      } finally {
        setLoadingClientes(false);
      }

      // 5. Productos
      try {
        const prodList = await productoService.getAll();
        setProductos(prodList);
      } catch (err) {
        console.error('Error cargando productos:', err);
      } finally {
        setLoadingProductos(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Manejadores de Facturas
  const handleViewInvoiceDetail = async (id) => {
    try {
      const data = await facturaService.getById(id);
      setSelectedInvoice(data);
    } catch (err) {
      showToast(err.message || 'Error obteniendo detalle de factura', 'error');
    }
  };

  const handleCambiarEstadoFactura = async (id, estado) => {
    try {
      const updated = await facturaService.cambiarEstado(id, estado);
      showToast(`Factura ${updated.folio} actualizada a "${estado}"`, 'success');
      fetchAllData();
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(updated);
      }
    } catch (err) {
      showToast(err.message || 'Error actualizando estado', 'error');
    }
  };

  const handleEliminarFactura = async (id) => {
    try {
      await facturaService.delete(id);
      showToast('Factura eliminada y stock restituido', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar la factura', 'error');
    }
  };

  const handleCrearFactura = async (payload) => {
    setIsSubmittingFactura(true);
    try {
      const nueva = await facturaService.create(payload);
      showToast(`¡Factura ${nueva.folio} creada exitosamente con transacción ACID!`, 'success');
      await fetchAllData();
      setCurrentPage('facturas');
      setSelectedInvoice(nueva);
    } catch (err) {
      showToast(err.message || 'Error emitiendo factura', 'error');
    } finally {
      setIsSubmittingFactura(false);
    }
  };

  // Manejadores de Clientes
  const handleCreateCliente = async (data) => {
    try {
      await clienteService.create(data);
      showToast('Cliente registrado con éxito', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'Error registrando cliente', 'error');
    }
  };

  const handleUpdateCliente = async (id, data) => {
    try {
      await clienteService.update(id, data);
      showToast('Cliente actualizado correctamente', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'Error actualizando cliente', 'error');
    }
  };

  const handleDeleteCliente = async (id) => {
    try {
      await clienteService.delete(id);
      showToast('Cliente eliminado', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar cliente', 'error');
    }
  };

  const handleViewClientInvoices = async (id) => {
    try {
      const cli = await clienteService.getById(id);
      setSelectedClientDetail(cli);
    } catch (err) {
      showToast(err.message || 'Error cargando historial del cliente', 'error');
    }
  };

  // Manejadores de Productos
  const handleCreateProducto = async (data) => {
    try {
      await productoService.create(data);
      showToast('Producto agregado al catálogo', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'Error creando producto', 'error');
    }
  };

  const handleUpdateProducto = async (id, data) => {
    try {
      await productoService.update(id, data);
      showToast('Producto actualizado correctamente', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'Error actualizando producto', 'error');
    }
  };

  const handleDeleteProducto = async (id) => {
    try {
      await productoService.delete(id);
      showToast('Producto eliminado del catálogo', 'success');
      fetchAllData();
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar producto', 'error');
    }
  };

  const handleViewProductStats = async (id) => {
    try {
      const prod = await productoService.getById(id);
      setSelectedProductDetail(prod);
    } catch (err) {
      showToast(err.message || 'Error cargando métricas del producto', 'error');
    }
  };

  const pageHeaders = {
    dashboard: {
      title: 'Panel Principal',
      subtitle: 'Métricas financieras en tiempo real y resumen de operaciones'
    },
    facturas: {
      title: 'Comprobantes Fiscales',
      subtitle: 'Historial completo de facturación, emisión y cobro'
    },
    'nueva-factura': {
      title: 'Emisión de Factura',
      subtitle: 'Creación de comprobante con validación automática de stock'
    },
    clientes: {
      title: 'Gestión de Clientes',
      subtitle: 'Control de cartera de clientes y cuentas relacionadas'
    },
    productos: {
      title: 'Inventario y Catálogo',
      subtitle: 'Control de existencias, precios y rotación de productos'
    }
  };

  const currentHeader = pageHeaders[currentPage] || pageHeaders.dashboard;

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        healthOk={healthOk}
      />

      <div className="app-main">
        <Topbar
          currentPage={currentPage}
          onRefresh={fetchAllData}
          isRefreshing={isRefreshing}
          onNewInvoice={currentPage !== 'nueva-factura' ? () => setCurrentPage('nueva-factura') : null}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="page-content">
          <AppRoutes
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            resumenData={resumenData}
            loadingResumen={loadingResumen}
            facturas={facturas}
            loadingFacturas={loadingFacturas}
            clientes={clientes}
            loadingClientes={loadingClientes}
            productos={productos}
            loadingProductos={loadingProductos}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            onViewInvoiceDetail={handleViewInvoiceDetail}
            onCambiarEstadoFactura={handleCambiarEstadoFactura}
            onEliminarFactura={handleEliminarFactura}
            onCrearFactura={handleCrearFactura}
            isSubmittingFactura={isSubmittingFactura}
            onCreateCliente={handleCreateCliente}
            onUpdateCliente={handleUpdateCliente}
            onDeleteCliente={handleDeleteCliente}
            onViewClientInvoices={handleViewClientInvoices}
            selectedClientDetail={selectedClientDetail}
            setSelectedClientDetail={setSelectedClientDetail}
            onCreateProducto={handleCreateProducto}
            onUpdateProducto={handleUpdateProducto}
            onDeleteProducto={handleDeleteProducto}
            onViewProductStats={handleViewProductStats}
            selectedProductDetail={selectedProductDetail}
            setSelectedProductDetail={setSelectedProductDetail}
          />
        </main>
      </div>

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
