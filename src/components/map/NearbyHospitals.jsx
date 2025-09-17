import React from 'react'
import MapView from './MapView'

export default function NearbyHospitals({ hospitals=[{name:'Trichy General'},{name:'Rajah Health'}] }){
  return <MapView items={hospitals} />
}
