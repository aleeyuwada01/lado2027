import React, { useState } from 'react';
import { Check, Minus, Package, Plus, Truck } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import type { IncidentSeverity, VehicleAsset } from '../types/campaign';

export const LogisticsView: React.FC = () => {
  const {
    branding,
    logisticsRequests,
    createLogisticsRequest,
    updateLogisticsRequest,
    vehicles,
    addVehicle,
    updateVehicleAvailability,
    inventory,
    adjustInventoryStock,
    departments,
    currentUser,
  } = useCampaign();

  const [tab, setTab] = useState<'requests' | 'fleet' | 'inventory'>('requests');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [reqForm, setReqForm] = useState({
    itemRequested: '',
    quantity: 50,
    priority: 'medium' as IncidentSeverity,
    department: departments[2] || 'Field Operations',
    stateCode: 'KT',
    lga: 'Katsina',
    purpose: '',
  });

  const [vehForm, setVehForm] = useState({
    registration: '',
    vehicleType: 'Field Hilux 4x4' as VehicleAsset['vehicleType'],
    driverName: '',
    stateCode: 'KT',
    assignedUnit: 'Field Operations',
  });

  const lgas = STATE_BY_CODE[reqForm.stateCode]?.lgas ?? [];
  const lowStockCount = inventory.filter((i) => i.quantity <= i.reorderLevel).length;

  const handleCreateReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.itemRequested.trim() || !reqForm.purpose.trim()) return;
    createLogisticsRequest({
      requesterName: currentUser.displayName,
      department: reqForm.department,
      stateCode: reqForm.stateCode,
      lga: reqForm.lga,
      itemRequested: reqForm.itemRequested.trim(),
      quantity: Number(reqForm.quantity) || 1,
      priority: reqForm.priority,
      purpose: reqForm.purpose.trim(),
      assignedOfficer: 'Daniel Pam',
      isDemo: false,
    });
    setReqForm({ ...reqForm, itemRequested: '', purpose: '' });
    setShowRequestForm(false);
  };

  const handleCreateVeh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehForm.registration.trim() || !vehForm.driverName.trim()) return;
    addVehicle({
      registration: vehForm.registration.trim().toUpperCase(),
      vehicleType: vehForm.vehicleType,
      driverName: vehForm.driverName.trim(),
      stateCode: vehForm.stateCode,
      assignedUnit: vehForm.assignedUnit,
      availability: 'Available',
      fuelLitresLogged: 0,
      lastServiceDate: new Date().toISOString().slice(0, 10),
      isDemo: false,
    });
    setVehForm({ ...vehForm, registration: '', driverName: '' });
    setShowVehicleForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Logistics, Fleet & Resource Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vehicle dispatch, fuel monitoring, warehouse inventory reorder controls, and fulfillment approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            {(
              [
                ['requests', `Requests (${logisticsRequests.length})`],
                ['fleet', `Fleet Vehicles (${vehicles.length})`],
                ['inventory', `Inventory (${inventory.length})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  tab === k
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Pending Approvals</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
            {logisticsRequests.filter((r) => r.approvalStatus === 'Pending Approval').length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Fleet Available</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {vehicles.filter((v) => v.availability === 'Available').length} / {vehicles.length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Total Fuel Logged</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">
            {vehicles.reduce((s, v) => s + v.fuelLitresLogged, 0).toLocaleString()} L
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Low-Stock Reorder Alerts</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
            {lowStockCount}
          </div>
        </div>
      </div>

      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowRequestForm((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" /> New Logistics Request
            </button>
          </div>

          {showRequestForm && (
            <form
              onSubmit={handleCreateReq}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <div>
                <label className="block text-xs font-medium mb-1">Item / Resource Requested *</label>
                <input
                  type="text"
                  value={reqForm.itemRequested}
                  onChange={(e) => setReqForm({ ...reqForm, itemRequested: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={reqForm.quantity}
                  onChange={(e) => setReqForm({ ...reqForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Priority</label>
                <select
                  value={reqForm.priority}
                  onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value as IncidentSeverity })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">State</label>
                <select
                  value={reqForm.stateCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setReqForm({ ...reqForm, stateCode: code, lga: STATE_BY_CODE[code]?.lgas[0] || '' });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  {NIGERIA_STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">LGA</label>
                <select
                  value={reqForm.lga}
                  onChange={(e) => setReqForm({ ...reqForm, lga: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  {lgas.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Operational Purpose *</label>
                <input
                  type="text"
                  value={reqForm.purpose}
                  onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowRequestForm(false)} className="px-3 py-2 text-xs text-slate-500">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Ref / Item</th>
                    <th className="py-2.5 px-3 font-semibold">Location & Requester</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-3 font-semibold">Approval</th>
                    <th className="py-2.5 px-3 font-semibold">Fulfillment</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logisticsRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{r.itemRequested}</div>
                        <div className="text-[11px] font-mono text-slate-500">{r.refCode} · {r.priority.toUpperCase()}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>{r.stateCode} / {r.lga}</div>
                        <div className="text-[11px] text-slate-500">{r.requesterName} · {r.purpose}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{r.quantity}</td>
                      <td className="py-2.5 px-3 font-medium">{r.approvalStatus}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{r.fulfillmentStatus}</td>
                      <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                        {r.approvalStatus === 'Pending Approval' && (
                          <button
                            type="button"
                            onClick={() => updateLogisticsRequest(r.id, { approvalStatus: 'Approved' })}
                            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {r.approvalStatus === 'Approved' && r.fulfillmentStatus !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateLogisticsRequest(r.id, {
                                fulfillmentStatus: r.fulfillmentStatus === 'Queued' ? 'Dispatched' : 'Delivered',
                              })
                            }
                            className="text-slate-800 dark:text-slate-200 font-medium hover:underline"
                          >
                            {r.fulfillmentStatus === 'Queued' ? 'Mark Dispatched' : 'Confirm Delivery'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowVehicleForm((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Truck className="w-3.5 h-3.5" /> Register Fleet Vehicle
            </button>
          </div>
          {showVehicleForm && (
            <form
              onSubmit={handleCreateVeh}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
            >
              <input
                type="text"
                placeholder="Registration (e.g. KT-FLD-22)"
                value={vehForm.registration}
                onChange={(e) => setVehForm({ ...vehForm, registration: e.target.value })}
                className="px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
              <select
                value={vehForm.vehicleType}
                onChange={(e) => setVehForm({ ...vehForm, vehicleType: e.target.value as VehicleAsset['vehicleType'] })}
                className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option>Command SUV</option>
                <option>Field Hilux 4x4</option>
                <option>Campaign Bus</option>
                <option>Logistics Van</option>
                <option>Media Truck</option>
                <option>Motorcycle Dispatch</option>
              </select>
              <input
                type="text"
                placeholder="Assigned Driver Name"
                value={vehForm.driverName}
                onChange={(e) => setVehForm({ ...vehForm, driverName: e.target.value })}
                className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white rounded-md"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Add Vehicle
              </button>
            </form>
          )}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Registration & Type</th>
                  <th className="py-2.5 px-3 font-semibold">Driver & Unit</th>
                  <th className="py-2.5 px-3 font-semibold">Current Trip</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Fuel (L)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-semibold">{v.registration}</div>
                      <div className="text-[11px] text-slate-500">{v.vehicleType} · {v.stateCode}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{v.driverName}</div>
                      <div className="text-[11px] text-slate-500">{v.assignedUnit}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{v.currentTrip || 'Stationed at motor pool'}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{v.fuelLitresLogged}</td>
                    <td className="py-2.5 px-4 text-right">
                      <select
                        value={v.availability}
                        aria-label={`Availability for ${v.registration}`}
                        onChange={(e) =>
                          updateVehicleAvailability(v.id, e.target.value as VehicleAsset['availability'], v.currentTrip)
                        }
                        className="text-xs bg-transparent border border-slate-300 dark:border-slate-700 rounded px-2 py-1"
                      >
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold">Warehouse Stock & Reorder Control</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Item & Category</th>
                  <th className="py-2.5 px-3 font-semibold">Storage Location</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Stock Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Reorder Threshold</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Stock Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventory.map((item) => {
                  const low = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id}>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-500">{item.category} · Supplier: {item.supplier}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {item.storageLocation} ({item.stateCode})
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${low ? 'text-red-700 dark:text-red-400' : ''}`}>
                        {item.quantity.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                        {item.reorderLevel} {item.unit} {low ? '· REORDER' : ''}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => adjustInventoryStock(item.id, -10)}
                          aria-label={`Issue 10 ${item.name}`}
                          className="inline-flex items-center px-2 py-1 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Minus className="w-3 h-3 mr-1" /> 10
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustInventoryStock(item.id, 50)}
                          aria-label={`Restock 50 ${item.name}`}
                          className="inline-flex items-center px-2 py-1 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Plus className="w-3 h-3 mr-1" /> 50
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
