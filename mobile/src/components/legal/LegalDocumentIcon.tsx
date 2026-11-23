import { Image } from 'expo-image';

export default function LegalDocumentIcon() {
  return (
    <Image
      source={require('@/assets/images/logo.webp')}
      contentFit="contain"
      style={{ width: 92, height: 92, marginTop: -12, marginBottom: 4 }}
    />
  );
}
