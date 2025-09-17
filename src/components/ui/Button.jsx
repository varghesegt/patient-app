import React from 'react'

export default function Button({ children, variant='primary', ...rest }){
  const base = 'px-4 py-2 rounded shadow'
  const styles = variant==='danger' ? 'bg-red-600 text-white' : 'bg-sky-600 text-white'
  return <button className={base + ' ' + styles} {...rest}>{children}</button>
}
