import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Modal, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTopicImages, addTopicImage, deleteTopicImage } from '../dbHelpers';
import { useTheme } from '../ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function ChapterImagesScreen({ route, navigation }) {
  const { topicId, topicName } = route.params;
  const { colors } = useTheme();

  const [images, setImages] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);

  const loadImages = useCallback(() => {
    setImages(getTopicImages(topicId));
  }, [topicId]);

  useFocusEffect(useCallback(() => loadImages(), [loadImages]));

  async function handleAddImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        addTopicImage(topicId, result.assets[0].uri);
        loadImages();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }

  function handleDelete(id) {
    Alert.alert('Delete Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteTopicImage(id);
        loadImages();
      }}
    ]);
  }

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerArea}>
        <Text style={[styles.header, { color: colors.text }]}>{topicName}</Text>
        <Text style={[styles.subheader, { color: colors.subText }]}>Image Archive</Text>
      </View>

      <FlatList
        data={images}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={60} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>No images for this chapter yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.imageCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setViewingImage(item.image_uri)}>
              <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.error }]}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.buttonText} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, borderColor: colors.border }]}
        onPress={handleAddImage}
      >
        <Ionicons name="add" size={36} color={colors.buttonText} />
      </TouchableOpacity>

      {/* Full Screen Viewer */}
      <Modal visible={!!viewingImage} transparent={true} animationType="fade">
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.closeViewer} onPress={() => setViewingImage(null)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.fullImage} />
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  headerArea: { padding: 20, paddingBottom: 0 },
  header: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subheader: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  imageCard: {
    width: COLUMN_WIDTH,
    borderRadius: 15,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0
  },
  thumbnail: { width: '100%', height: COLUMN_WIDTH },
  deleteBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeViewer: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%', resizeMode: 'contain' }
});
