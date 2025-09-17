import React from 'react'
// This is a mock map view. Replace with Mapbox/Leaflet for real demo.
export default function MapView({ items=[] }){
  return (
    <div className="border rounded h-64 p-2 bg-white">
      <div className="text-sm text-gray-600 mb-2">Map (mock)</div>
      <ul className="text-sm">
        {items.map((it,idx)=> <li key={idx}>{it.name} — {it.distance || '2 km'}</li>)}
      </ul>
    </div>
  )
}
