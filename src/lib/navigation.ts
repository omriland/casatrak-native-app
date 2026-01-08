import { createNavigationContainerRef } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()
