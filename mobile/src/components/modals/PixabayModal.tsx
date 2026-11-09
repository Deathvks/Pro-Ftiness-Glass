import { getContrastColor } from '@/utils/colorUtils';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Search, X, Image as ImageIcon } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import {
  SwipeableBottomSheet,
  getAppleSheetCardStyle,
} from '@/components/ui/SwipeableBottomSheet';

interface PixabayModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 40 - (numColumns - 1) * 12) / numColumns;

export const PixabayModal: React.FC<PixabayModalProps> = ({
  visible,
  onClose,
  onSelectImage,
}) => {
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
      activeOpacity={0.85}
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
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.background}
      height="88%"
      maxHeight="88%"
      avoidKeyboard
    >
      <View style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Imágenes de Portada</Text>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.75}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={19} color={colors.text} />
          </TouchableOpacity>
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
            <Search size={19} color={colors.textSecondary} style={styles.searchIcon} />
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
            showsVerticalScrollIndicator={false}
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
    </SwipeableBottomSheet>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
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
