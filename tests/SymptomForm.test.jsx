import React from 'react'
import { render, screen } from '@testing-library/react'
import SymptomForm from '../src/components/triage/SymptomForm'

test('renders symptom form', ()=>{
  render(<SymptomForm />)
  expect(screen.getByText(/Describe symptoms/i)).toBeInTheDocument()
})
