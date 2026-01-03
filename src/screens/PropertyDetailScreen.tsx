import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
} from 'react-native'
import PagerView from 'react-native-pager-view'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { launchImageLibrary } from 'react-native-image-picker'
import DocumentPicker, { types } from 'react-native-document-picker'
import {
  getPropertyNotes,
  createNote,
  deleteNote,
  updatePropertyRating,
  togglePropertyFlag,
  deleteProperty,
  updatePropertyStatus,
  getPropertyAttachments,
  uploadPropertyAttachment,
  getPublicUrl,
  deletePropertyAttachment,
  updateProperty,
} from '../lib/properties'
import { Note, PropertyStatus, Attachment } from '../types/property'

type NavigationProp = StackNavigationProp<RootStackParamList>
type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>

const STATUSES: PropertyStatus[] = ['Seen', 'Interested', 'Contacted Realtor', 'Visited', 'On Hold', 'Irrelevant', 'Purchased']

export default function PropertyDetailScreen() {
  const insets = useSafeAreaInsets()
  const route = useRoute<PropertyDetailRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const initialProperty = route.params.property

  const [property, setProperty] = useState(initialProperty)
  const [notes, setNotes] = useState<Note[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newNote, setNewNote] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [loadingAttachments, setLoadingAttachments] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  // Zoom and Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isGalleryVisible, setIsGalleryVisible] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  // Description editing state
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedDesc, setEditedDesc] = useState(property.description || '')
  const [isSavingDesc, setIsSavingDesc] = useState(false)

  useEffect(() => {
    loadNotes()
    loadAttachments()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await getPropertyNotes(property.id)
      setNotes(data)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }

  const loadAttachments = async () => {
    try {
      const data = await getPropertyAttachments(property.id)
      setAttachments(data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const note = await createNote(property.id, newNote.trim())
      setNotes([note, ...notes])
      setNewNote('')
    } catch (error) {
      Alert.alert('Error', 'Failed to add note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(id)
            setNotes(notes.filter((n) => n.id !== id))
          } catch (error) {
            Alert.alert('Error', 'Failed to delete note')
          }
        },
      },
    ])
  }

  const handleUpdateRating = async (rating: number) => {
    try {
      await updatePropertyRating(property.id, rating)
      setProperty({ ...property, rating })
    } catch (error) {
      Alert.alert('Error', 'Failed to update rating')
    }
  }

  const handleToggleFlag = async () => {
    try {
      const isFlagged = !property.is_flagged
      await togglePropertyFlag(property.id, isFlagged)
      setProperty({ ...property, is_flagged: isFlagged })
    } catch (error) {
      Alert.alert('Error', 'Failed to update flag')
    }
  }

  const handleDeleteProperty = async () => {
    Alert.alert('Delete Property', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProperty(property.id)
            navigation.goBack()
          } catch (error) {
            Alert.alert('Error', 'Failed to delete property')
          }
        },
      },
    ])
  }

  const handleUpdateStatus = () => {
    Alert.alert(
      'Update Status',
      'Select professional progress:',
      STATUSES.map((s) => ({
        text: s,
        onPress: async () => {
          try {
            await updatePropertyStatus(property.id, s)
            setProperty({ ...property, status: s })
          } catch (error) {
            Alert.alert('Error', 'Failed to update status')
          }
        },
      }))
    )
  }

  const handleAddPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    })

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0]
      setUploadingAttachment(true)
      try {
        const file = {
          uri: asset.uri!,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        }
        const attachment = await uploadPropertyAttachment(property.id, file)
        setAttachments([attachment, ...attachments])
      } catch (error) {
        Alert.alert('Error', 'Failed to upload photo')
      } finally {
        setUploadingAttachment(false)
      }
    }
  }

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [types.pdf],
      })

      const asset = result[0]
      setUploadingAttachment(true)
      try {
        const file = {
          uri: asset.uri,
          name: asset.name || `doc_${Date.now()}.pdf`,
          type: asset.type || 'application/pdf',
          size: asset.size || 0,
        }
        const attachment = await uploadPropertyAttachment(property.id, file)
        setAttachments([attachment, ...attachments])
      } catch (error) {
        Alert.alert('Error', 'Failed to upload document')
      } finally {
        setUploadingAttachment(false)
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Document picker error:', err)
      }
    }
  }

  const handleAddAttachment = () => {
    Alert.alert(
      'Add Attachment',
      'Choose a file type:',
      [
        { text: 'Photo (Gallery)', onPress: handleAddPhoto },
        { text: 'Document (PDF)', onPress: handleAddDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleShare = async () => {
    try {
      const message = `${property.title}\nPrice: ${formatPrice(property.asked_price)}\nAddress: ${property.address}\n${property.url || ''}`
      await Share.share({ message })
    } catch (error) {
      console.log('Error sharing:', error)
    }
  }

  const handleDeleteAttachment = async (attachment: Attachment) => {
    Alert.alert('Delete Attachment', 'Delete this attachment from storage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePropertyAttachment(attachment.id, attachment.file_path)
            setAttachments(attachments.filter((a) => a.id !== attachment.id))
            if (isGalleryVisible) {
              closeGallery()
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete photo')
          }
        },
      },
    ])
  }

  const handleSaveDescription = async () => {
    try {
      setIsSavingDesc(true)
      await updateProperty(property.id, { description: editedDesc })
      setProperty((prev) => ({ ...prev, description: editedDesc }))
      setIsEditingDesc(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to update description')
    } finally {
      setIsSavingDesc(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === 1) return 'Unknown'
    return new Intl.NumberFormat('he-IL', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price) + ' ₪'
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const descriptionDoubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(setIsEditingDesc)(true)
    })

  const openGallery = (index: number) => {
    const imagesOnly = attachments.filter(a => a.file_type === 'image')
    if (imagesOnly.length === 0) return

    // Find index in filtered list
    const attachmentId = attachments[index]?.id
    const galleryIndex = imagesOnly.findIndex(a => a.id === attachmentId)

    if (galleryIndex !== -1) {
      setSelectedImageIndex(galleryIndex)
      setIsGalleryVisible(true)
    }
  }

  const closeGallery = () => {
    setIsGalleryVisible(false)
    setSelectedImageIndex(null)
  }

  const handleAttachmentPress = (attachment: Attachment, index: number) => {
    if (attachment.file_type === 'pdf') {
      const url = getPublicUrl(attachment.file_path)
      Linking.openURL(url)
    } else {
      openGallery(index)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Dynamic Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View style={styles.titleInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {property.title || 'Untitled Property'}
              </Text>
              <View style={styles.headerLocationRow}>
                <FeatherIcon name="map-pin" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.headerLocationText} numberOfLines={1}>
                  {property.address}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleToggleFlag} style={styles.iconButton}>
                <FeatherIcon
                  name="flag"
                  size={18}
                  color={property.is_flagged ? theme.colors.accent : theme.colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                <FeatherIcon name="share-2" size={18} color={theme.colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <FeatherIcon name="x" size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.statusPill} onPress={handleUpdateStatus}>
            <Text style={styles.statusPillText}>{property.status.toUpperCase()}</Text>
            <FeatherIcon name="chevron-down" size={14} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Rating Section */}
          <View style={styles.card}>
            <View style={styles.ratingHeader}>
              <View>
                <Text style={styles.cardLabel}>Rating</Text>
                <Text style={styles.cardSublabel}>Click stars to rate this property</Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => handleUpdateRating(s)}>
                    <IonIcon
                      name={s <= (property.rating || 0) ? 'star' : 'star-outline'}
                      size={24}
                      color={s <= (property.rating || 0) ? '#FBBF24' : '#E2E8F0'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Primary Specs */}
          <View style={styles.specsContainer}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardLabel}>Asking Price</Text>
              <Text style={styles.specValue}>{formatPrice(property.asked_price)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.card, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.cardLabel}>Size</Text>
              <Text style={styles.specValue}>
                {property.square_meters && property.square_meters !== 1 ? `${property.square_meters}m²` : 'Unknown'}
              </Text>
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardLabel}>Rooms</Text>
              <Text style={styles.specValue}>{property.rooms}</Text>
            </View>
          </View>

          {/* Details Section */}
          <Section title="DETAILS">
            <DetailRow label="Type" value={property.property_type || 'Unknown'} />
            <DetailRow label="Source" value={property.source || 'Unknown'} />
            <DetailRow label="Broker" value={property.apartment_broker ? 'Yes' : 'No'} />
            <DetailRow label="Added" value={new Date(property.created_at).toLocaleDateString()} />
            {property.url && (
              <DetailRow
                label="Listing"
                value="View Link"
                onLinkPress={() => Linking.openURL(property.url!)}
              />
            )}
          </Section>

          {/* Description Section */}
          <Section title="DESCRIPTION">
            {isEditingDesc ? (
              <View>
                <TextInput
                  style={[styles.descriptionInput, { textAlign: 'right' }]}
                  value={editedDesc}
                  onChangeText={setEditedDesc}
                  multiline
                  autoFocus
                />
                <View style={styles.editDescActions}>
                  <TouchableOpacity onPress={() => setIsEditingDesc(false)} style={styles.cancelDescBtn}>
                    <Text style={styles.cancelDescText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveDescription} style={styles.saveDescBtn} disabled={isSavingDesc}>
                    {isSavingDesc ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveDescText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <GestureDetector gesture={descriptionDoubleTap}>
                <Text style={[styles.descriptionText, { textAlign: 'right' }]}>
                  {property.description || 'Double tap to add description...'}
                </Text>
              </GestureDetector>
            )}
          </Section>

          {/* Attachments Section */}
          <Section
            title={`ATTACHMENTS (${attachments.length})`}
            rightAction={{ label: 'View All', onPress: () => openGallery(0) }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddAttachment}
                disabled={uploadingAttachment}
              >
                {uploadingAttachment ? (
                  <ActivityIndicator color={theme.colors.textMuted} />
                ) : (
                  <>
                    <FeatherIcon name="plus" size={24} color={theme.colors.textMuted} />
                    <Text style={styles.addPhotoText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
              {attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={attachment.id}
                  style={styles.photoContainer}
                  onPress={() => handleAttachmentPress(attachment, index)}
                >
                  {attachment.file_type === 'pdf' ? (
                    <View style={[styles.photo, styles.pdfThumbnail]}>
                      <FeatherIcon name="file-text" size={32} color={theme.colors.textMuted} />
                      <Text style={styles.pdfLabel} numberOfLines={1}>{attachment.file_name}</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: getPublicUrl(attachment.file_path) }}
                      style={styles.photo}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Section>

          {/* Contact Section */}
          <Section title="CONTACT">
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <FeatherIcon name="user" size={18} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.contactText}>{property.contact_name || 'No contact name'}</Text>
            </View>
            {property.contact_phone && (
              <View style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <FeatherIcon name="phone" size={18} color={theme.colors.textSecondary} />
                </View>
                <Text style={styles.contactText}>{property.contact_phone}</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://wa.me/${property.contact_phone?.replace(/\D/g, '')}`)}
                  style={styles.waIcon}
                >
                  <IonIcon name="logo-whatsapp" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </Section>

          {/* Notes Section */}
          <Section title={`Notes (${notes.length})`}>
            {loadingNotes ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : notes.length === 0 ? (
              <View style={styles.emptyNotes}>
                <FeatherIcon name="edit-3" size={40} color={theme.colors.textMuted} style={{ marginBottom: 12, opacity: 0.2 }} />
                <Text style={styles.emptyNotesTitle}>No notes yet</Text>
                <Text style={styles.emptyNotesSub}>Add your first note below</Text>
              </View>
            ) : (
              notes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteDate}>
                      {formatRelativeTime(note.created_at)}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                      <Text style={styles.noteDelete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.noteContent, { textAlign: 'right' }]}>{note.content}</Text>
                </View>
              ))
            )}

            <View style={styles.addNoteContainer}>
              <TextInput
                style={[styles.noteInput, { textAlign: 'right' }]}
                placeholder="Add a note..."
                value={newNote}
                onChangeText={setNewNote}
                multiline
              />
              <TouchableOpacity
                style={[styles.addNoteBtn, !newNote.trim() && styles.disabledBtn]}
                onPress={handleAddNote}
                disabled={savingNote || !newNote.trim()}
              >
                {savingNote ? <ActivityIndicator color="#FFF" /> : <Text style={styles.addNoteBtnText}>Add Note</Text>}
              </TouchableOpacity>
            </View>
          </Section>
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProperty}>
            <FeatherIcon name="trash-2" size={18} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('PropertyForm', { property })}
          >
            <FeatherIcon name="edit-2" size={18} color={theme.colors.white} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Image Gallery Modal */}
        <Modal
          visible={isGalleryVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeGallery}
        >
          <View style={styles.galleryModalContainer}>
            <View style={styles.galleryHeader}>
              <TouchableOpacity onPress={closeGallery} style={styles.galleryCloseBtn}>
                <FeatherIcon name="x" size={24} color={theme.colors.white} />
              </TouchableOpacity>
              <Text style={styles.galleryCountText}>
                {(selectedImageIndex ?? 0) + 1} / {attachments.filter(a => a.file_type === 'image').length}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteAttachment(attachments[selectedImageIndex ?? 0])}
                style={styles.galleryActionBtn}
              >
                <FeatherIcon name="trash-2" size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>

            <PagerView
              style={styles.pagerView}
              initialPage={selectedImageIndex ?? 0}
              onPageSelected={(e) => setSelectedImageIndex(e.nativeEvent.position)}
              scrollEnabled={!isZoomed}
            >
              {attachments.filter(a => a.file_type === 'image').map((att) => (
                <ZoomableImage
                  key={att.id}
                  uri={getPublicUrl(att.file_path)}
                  onZoomChange={setIsZoomed}
                />
              ))}
            </PagerView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  )
}

function ZoomableImage({ uri, onZoomChange }: { uri: string; onZoomChange: (zoomed: boolean) => void }) {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, savedScale.value * event.scale)
      if (scale.value > 1.05) {
        runOnJS(onZoomChange)(true)
      }
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        scale.value = withSpring(1)
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        savedScale.value = 1
        savedTranslateX.value = 0
        savedTranslateY.value = 0
        runOnJS(onZoomChange)(false)
      } else {
        savedScale.value = scale.value
      }
    })

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .activeOffsetX([-20, 20])
    .activeOffsetY([-20, 20])
    .onUpdate((event) => {
      if (scale.value > 1.01) {
        translateX.value = savedTranslateX.value + event.translationX
        translateY.value = savedTranslateY.value + event.translationY
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value
        savedTranslateY.value = translateY.value
      }
    })

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.1) {
        scale.value = withSpring(1)
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        savedScale.value = 1
        savedTranslateX.value = 0
        savedTranslateY.value = 0
        runOnJS(onZoomChange)(false)
      } else {
        scale.value = withSpring(2.5)
        savedScale.value = 2.5
        runOnJS(onZoomChange)(true)
      }
    })

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return (
    <View style={styles.pagerItem}>
      <GestureDetector gesture={composedGesture}>
        <Animated.Image
          source={{ uri }}
          style={[styles.pagerImage, animatedStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    </View>
  )
}

function Section({
  title,
  children,
  rightAction,
}: {
  title: string
  children: React.ReactNode
  rightAction?: { label: string; onPress: () => void }
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={styles.sectionActionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

function DetailRow({
  label,
  value,
  onLinkPress,
}: {
  label: string
  value: string
  onLinkPress?: () => void
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <TouchableOpacity disabled={!onLinkPress} onPress={onLinkPress} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.detailValue, onLinkPress && styles.detailLink]}>
          {value}
        </Text>
        {onLinkPress && <FeatherIcon name="external-link" size={14} color={theme.colors.secondary} style={{ marginLeft: 6 }} />}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: theme.colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleInfo: {
    flex: 1,
    paddingRight: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontFamily,
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusPillText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamily,
    marginRight: 6,
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  cardSublabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  specsContainer: {
    marginBottom: 16,
  },
  specValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  sectionActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '700',
  },
  detailLink: {
    color: theme.colors.secondary,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    fontFamily: theme.typography.fontFamily,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 100,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPhotoText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontWeight: '700',
  },
  waIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyNotesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  emptyNotesSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  noteItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  noteDelete: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '700',
  },
  noteContent: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    fontFamily: theme.typography.fontFamily,
  },
  addNoteContainer: {
    marginTop: 20,
  },
  noteInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  addNoteBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  addNoteBtnText: {
    color: theme.colors.white,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamily,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontWeight: '800',
    marginLeft: 8,
    fontFamily: theme.typography.fontFamily,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
  },
  editButtonText: {
    color: theme.colors.white,
    fontWeight: '800',
    marginLeft: 8,
    fontFamily: theme.typography.fontFamily,
  },
  // Gallery Modal Styles
  galleryModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  galleryCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryCountText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  pagerView: {
    flex: 1,
  },
  pagerItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerImage: {
    width: '100%',
    height: '100%',
  },
  descriptionInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editDescActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelDescBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelDescText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  saveDescBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveDescText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  pdfThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pdfLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 8,
    paddingHorizontal: 8,
    fontFamily: theme.typography.fontFamily,
  },
})
