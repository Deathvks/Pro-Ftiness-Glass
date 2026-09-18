import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Image as ImageIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { GlassButton } from '@/components/ui/GlassButton';

interface PixabayModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 48 - (numColumns - 1) * 12) / numColumns; // 48 is padding (24 * 2)

export const PixabayModal: React.FC<PixabayModalProps> = ({ visible, onClose, onSelectImage }) => {
  const insets = useSafeAreaInsets();
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;

  const [query, setQuery] = useState('gym motivation');
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // You might want to use process.env.EXPO_PUBLIC_PIXABAY_API_KEY or an explicit key if set in the environment
  const PIXABAY_API_KEY = process.env.EXPO_PUBLIC_PIXABAY_API_KEY || '54499941-22ecc9bdc1c7632f7594618a8';

  const searchImages = async (searchQuery: string) => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchQuery)}&image_type=photo&per_page=24&safesearch=true&orientation=horizontal`
      );
      const data = await response.json();
      setImages(data.hits || []);
    } catch (error) {
      console.error("Error fetching Pixabay images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      searchImages(query);
    }
  }, [visible]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.imageCard, { width: imageSize, height: imageSize, backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        onSelectImage(item.largeImageURL);
        onClose();
      }}
    >
      <Image source={{ uri: item.webformatURL }} style={StyleSheet.absoluteFill} borderRadius={16} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={theme === 'oled' ? 50 : 80} tint={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Pixabay</Text>
              <GlassButton theme={theme} colors={colors} onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20 }}>
                <X size={20} color={colors.textSecondary} />
              </GlassButton>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Buscar imágenes..."
                  placeholderTextColor={colors.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => searchImages(query)}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* Images Grid */}
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            ) : images.length > 0 ? (
              <FlatList
                data={images}
                keyExtractor={(item) => item.id.toString()}
                numColumns={numColumns}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
              />
            ) : (
              <View style={styles.centerContainer}>
                <ImageIcon size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
                <Text style={{ color: colors.textSecondary }}>No se encontraron imágenes</Text>
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  searchContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
