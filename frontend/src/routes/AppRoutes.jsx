import React from 'react';
import DashboardPage from '../pages/DashboardPage';
import FacturasPage from '../pages/FacturasPage';
import NuevaFacturaPage from '../pages/NuevaFacturaPage';
import ClientesPage from '../pages/ClientesPage';
import ProductosPage from '../pages/ProductosPage';

export default function AppRoutes({
  currentPage,
  setCurrentPage,
  resumenData,
  loadingResumen,
  facturas,
  loadingFacturas,
  clientes,
  loadingClientes,
  productos,
  loadingProductos,
  selectedInvoice,
  setSelectedInvoice,
  onViewInvoiceDetail,
  onCambiarEstadoFactura,
  onEliminarFactura,
  onCrearFactura,
  isSubmittingFactura,
  onCreateCliente,
  onUpdateCliente,
  onDeleteCliente,
  onViewClientInvoices,
  selectedClientDetail,
  setSelectedClientDetail,
  onCreateProducto,
  onUpdateProducto,
  onDeleteProducto,
  onViewProductStats,
  selectedProductDetail,
  setSelectedProductDetail
}) {
  switch (currentPage) {
    case 'dashboard':
      return (
        <DashboardPage
          data={resumenData}
          loading={loadingResumen}
          onNavigate={(page) => setCurrentPage(page)}
          onSelectInvoice={(id) => {
            onViewInvoiceDetail(id);
            setCurrentPage('facturas');
          }}
        />
      );

    case 'facturas':
      return (
        <FacturasPage
          facturas={facturas}
          loading={loadingFacturas}
          onNewInvoice={() => setCurrentPage('nueva-factura')}
          onCambiarEstado={onCambiarEstadoFactura}
          onEliminarFactura={onEliminarFactura}
          selectedInvoice={selectedInvoice}
          setSelectedInvoice={setSelectedInvoice}
          onViewInvoiceDetail={onViewInvoiceDetail}
        />
      );

    case 'nueva-factura':
      return (
        <NuevaFacturaPage
          clientes={clientes.filter((c) => c.activo)}
          productos={productos}
          onSubmit={onCrearFactura}
          onCancel={() => setCurrentPage('facturas')}
          isSubmitting={isSubmittingFactura}
        />
      );

    case 'clientes':
      return (
        <ClientesPage
          clientes={clientes}
          loading={loadingClientes}
          onCreateCliente={onCreateCliente}
          onUpdateCliente={onUpdateCliente}
          onDeleteCliente={onDeleteCliente}
          onViewClientInvoices={onViewClientInvoices}
          selectedClientDetail={selectedClientDetail}
          setSelectedClientDetail={setSelectedClientDetail}
        />
      );

    case 'productos':
      return (
        <ProductosPage
          productos={productos}
          loading={loadingProductos}
          onCreateProducto={onCreateProducto}
          onUpdateProducto={onUpdateProducto}
          onDeleteProducto={onDeleteProducto}
          onViewProductStats={onViewProductStats}
          selectedProductDetail={selectedProductDetail}
          setSelectedProductDetail={setSelectedProductDetail}
        />
      );

    default:
      return (
        <DashboardPage
          data={resumenData}
          loading={loadingResumen}
          onNavigate={(page) => setCurrentPage(page)}
          onSelectInvoice={(id) => {
            onViewInvoiceDetail(id);
            setCurrentPage('facturas');
          }}
        />
      );
  }
}
