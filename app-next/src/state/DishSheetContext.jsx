import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import DishSheet from '../components/DishSheet.jsx'

const DishSheetContext = createContext(null)

export function useDishSheet() {
  return useContext(DishSheetContext)
}

export function DishSheetProvider({ children }) {
  const [dishId, setDishId] = useState(null)

  const openDish = useCallback((dish) => {
    const id = typeof dish === 'object' ? dish?.id : dish
    if (id != null) setDishId(Number(id))
  }, [])
  const closeDish = useCallback(() => setDishId(null), [])

  const value = useMemo(() => ({ openDish, closeDish }), [openDish, closeDish])

  return (
    <DishSheetContext.Provider value={value}>
      {children}
      <DishSheet dishId={dishId} open={dishId != null} onClose={closeDish} />
    </DishSheetContext.Provider>
  )
}
