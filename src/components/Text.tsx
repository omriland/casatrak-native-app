import React from 'react'
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native'
import { theme } from '../theme/theme'

interface TextProps extends RNTextProps {
  children?: React.ReactNode
}

export const Text: React.FC<TextProps> = ({ style, ...props }) => {
  return (
    <RNText style={[styles.default, style]} {...props}>
      {props.children}
    </RNText>
  )
}

const styles = StyleSheet.create({
  default: {
    fontFamily: theme.typography.fontFamily,
  },
})

export default Text
