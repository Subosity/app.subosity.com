// Common select styles for react-select components
export const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: 'var(--bs-body-bg)',
    borderColor: 'var(--bs-border-color)',
    '&:hover': {
      borderColor: 'var(--bs-primary)'
    }
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'var(--bs-body-bg)',
    borderColor: 'var(--bs-border-color)'
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused
      ? 'var(--bs-primary)'
      : 'var(--bs-body-bg)',
    color: state.isFocused
      ? 'white'
      : 'var(--bs-body-color)'
  }),
  input: (base: any) => ({
    ...base,
    color: 'var(--bs-body-color)'
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'var(--bs-body-color)'
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: 'var(--bs-primary)',
    color: 'white'
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: 'white'
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: 'white',
    ':hover': {
      backgroundColor: 'var(--bs-primary-dark)',
      color: 'white'
    }
  })
};