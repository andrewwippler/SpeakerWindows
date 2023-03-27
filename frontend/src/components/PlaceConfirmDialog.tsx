import { Fragment, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { selectModal, setModal } from '@/features/modal/reducer'
import ConfirmDialog from './ConfirmDialog'
import api from '@/library/api'
import { setUpdateUI } from '@/features/ui/reducer'
import { setFlashMessage } from '@/features/flash/reducer'

export default function PlaceConfirmDialog({ title, id }: {title: string | undefined, id: string | undefined}) {

  const dispatch = useAppDispatch()
  const placeId = id

  const handlePlaceDelete = () => {
    // delete illustration
    api.delete(`/places/${placeId}`, '')
    .then(data => {
      dispatch(setModal(false))
      dispatch(setUpdateUI(true))
      dispatch(setFlashMessage({severity: 'danger', message: data.message}))
  });
  };

  return (
    <ConfirmDialog handleAgree={handlePlaceDelete} title={title} deleteName="Place" />
  )
}
