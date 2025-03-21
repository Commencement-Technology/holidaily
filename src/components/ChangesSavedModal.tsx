import React, { useEffect } from 'react'
import { ModalProps } from 'react-native-modal'
import { CustomModal } from 'components/CustomModal'
import TickIcon from 'assets/icons/icon-button-tick.svg'
import { BaseOpacity, mkUseStyles, Text, Theme, theme } from 'utils/theme/index'

type ChangesSavedModalProps = Pick<ModalProps, 'isVisible'> & {
  hideModal?: F0
  content?: string
}
export const ChangesSavedModal = ({ isVisible, hideModal, content }: ChangesSavedModalProps) => {
  const styles = useStyles()

  useEffect(() => {
    if (hideModal) {
      const timer = setTimeout(hideModal, 3000)
      return () => clearTimeout(timer)
    }
  }, [hideModal])

  return (
    <CustomModal
      isVisible={isVisible}
      onBackdropPress={hideModal}
      backdropColor={theme.colors.white}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      swipeDirection="down"
      style={styles.modal}
      hideModalContentWhileAnimating>
      <BaseOpacity onPress={hideModal} flex={1} justifyContent="center" alignItems="center">
        <Text variant="displayBoldMD" marginBottom="xl">
          {content}
        </Text>
        <TickIcon />
      </BaseOpacity>
    </CustomModal>
  )
}

const useStyles = mkUseStyles((theme: Theme) => ({
  modal: {
    flex: 1,
    height: 315,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    bottom: -20,
    left: -20,
    right: -20,
    borderTopLeftRadius: theme.borderRadii.lmin,
    borderTopRightRadius: theme.borderRadii.lmin,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: -2, height: 0 },
    shadowColor: theme.colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 20,
    paddingHorizontal: theme.spacing.m,
  },
}))
