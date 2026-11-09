import { getContrastColor } from '@/utils/colorUtils';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Image as ImageIcon } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { GlassButton } from '@/components/ui/GlassButton';
import { getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

interface PixabayModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 48 - (numColumns - 1) * 12) / numColumns;

export const PixabayModal: React.FC<PixabayModalProps> = ({
  visible,
  onClose,
  onSelectImage,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const [query, setQuery] = useState('gym motivation');
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const PIXABAY_API_KEY =
    process.env.EXPO_PUBLIC_PIXABAY_API_KEY || '54499941-22ecc9bdc1c7632f7594618a8';

  const searchImages = async (searchQuery: string) => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
          searchQuery
        )}&image_type=photo&per_page=24&safesearch=true&orientation=horizontal`
      );
      const data = await response.json();
      setImages(data.hits || []);
    } catch (error) {
      console.error('Error fetching Pixabay images:', error);
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
      style={[
        styles.imageCard,
        {
          width: imageSize,
          height: imageSize,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: isIOS ? 0 : 1,
        },
        getAppleSheetCardStyle(isDark, 16),
      ]}
      onPress={() => {
        onSelectImage(item.largeImageURL);
        onClose();
      }}
    >
      <Image
        source={{ uri: item.webformatURL }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={isIOS ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: isIOS ? (isDark ? '#1C1C1E' : '#F2F2F7') : colors.background,
              paddingTop: isIOS ? 8 : insets.top,
            },
          ]}
        >
          {isIOS && (
            <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}>
              <View
                style={{
                  width: 38,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: isDark
                    ? 'rgba(235, 235, 245, 0.3)'
                    : 'rgba(60, 60, 67, 0.25)',
                }}
              />
            </View>
          )}

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Pixabay</Text>
            <GlassButton
              theme={theme}
              colors={colors}
              onPress={onClose}
              style={{ width: 38, height: 38, borderRadius: 19 }}
            >
              <X size={20} color={colors.textSecondary} />
            </GlassButton>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: isIOS ? 0 : 1,
                },
                getAppleSheetCardStyle(isDark, 16),
              ]}
            >
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
              <ActivityIndicator size="large" color={getContrastColor(colors.tint, theme)} />
            </View>
          ) : images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={item => item.id.toString()}
              numColumns={numColumns}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.row}
            />
          ) : (
            <View style={styles.centerContainer}>
              <ImageIcon
                size={48}
                color={colors.textSecondary}
                style={{ marginBottom: 16, opacity: 0.5 }}
              />
              <Text style={{ color: colors.textSecondary }}>No se encontraron imágenes</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.4,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 14,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 24,
    paddingTop: 4,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
