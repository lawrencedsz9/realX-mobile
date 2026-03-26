import { Ionicons } from '@expo/vector-icons';
import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import PhonkText from '../components/PhonkText';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

/*
  UI Format based on design specs:
  - Header: Left arrow, Title "Redemption History"
  - Card: 
    - Vendor image, Vendor Name, "Total Paid: XX QAR", "Estimated savings: YY QAR"
    - "Offer Redeemed": "ZZ% Student Discount", "Redeem Again" button
    - Bottom of card: "Redeemed on Jul 7 08:07 AM"
*/

interface Transaction {
  id: string;
  type: string;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  discountValue?: number;
  discountType?: string;
  discountAmount?: number;
  finalAmount?: number;
  offerId?: string;
  createdAt?: any;
}

export default function RedemptionHistoryScreen() {
  const { horizontalPadding } = useResponsive();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendorLogos, setVendorLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const snap = await getDocs(q);
        const fetchedTransactions: Transaction[] = [];
        const uniqueVendorIds = new Set<string>();

        snap.forEach((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = docSnap.data();
          fetchedTransactions.push({
            id: docSnap.id,
            ...data
          } as Transaction);

          if (data.vendorId) {
            uniqueVendorIds.add(data.vendorId);
          }
        });

        if (isMounted) {
          setTransactions(fetchedTransactions);
        }

        // Fetch vendor details (for logos)
        const logos: Record<string, string> = {};
        for (const vendorId of Array.from(uniqueVendorIds)) {
          const vSnap = await getDoc(doc(db, 'vendors', vendorId));
          if (vSnap.exists()) {
            logos[vendorId] = vSnap.data()?.profilePicture || '';
          }
        }

        if (isMounted) {
          setVendorLogos(logos);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching redemptions:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (timestamp?: any) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isOffer = item.type === 'offer_redemption';
    const logoUri = vendorLogos[item.vendorId];
    
    // Fallbacks
    const savings = item.discountAmount ?? 0;
    const paid = item.finalAmount ?? item.totalAmount ?? 0;
    const discountText =
      isOffer && item.discountValue
        ? `${item.discountValue}${item.discountType === 'percentage' ? '%' : ''} Student Discount`
        : 'Gift Card Redeemed';

    return (
      <View style={{ marginBottom: 24 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.vendorInfo}>
              <View style={styles.logoContainer}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logo} contentFit="contain" />
                ) : (
                  <Ionicons name="storefront" size={24} color="#CCC" />
                )}
              </View>
              <View style={styles.vendorTextContainer}>
                <PhonkText style={styles.vendorName} numberOfLines={1}>
                  {item.vendorName || 'VENDOR'}
                </PhonkText>
                <Text style={styles.savingsText}>Estimated savings: {savings.toFixed(0)} QAR</Text>
              </View>
            </View>

            <View style={styles.paidInfo}>
              <Text style={styles.paidLabel}>Total Paid</Text>
              <PhonkText style={styles.paidAmount}>{paid.toFixed(0)} QAR</PhonkText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.offerInfo}>
              <Text style={styles.offerLabel}>Offer Redeemed</Text>
              <Text style={styles.offerValue} numberOfLines={1}>
                {discountText}
              </Text>
            </View>

            {item.offerId && (
              <TouchableOpacity
                style={styles.redeemButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/redeem/[id]',
                    params: { id: item.offerId!, vendorId: item.vendorId },
                  })
                }
              >
                <Text style={styles.redeemButtonText}>Redeem Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.dateText}>Redeemed on {formatDate(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ResponsiveContainer>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Redemption History</Text>
        </View>
      </ResponsiveContainer>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brandGreen} />
        </View>
      ) : (
        <ResponsiveContainer>
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPadding }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No redemptions found.</Text>
              </View>
            }
          />
        </ResponsiveContainer>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Typography.poppins.medium,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 24,
    padding: 20,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  vendorTextContainer: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    color: '#000',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    fontFamily: Typography.poppins.medium,
    color: '#888',
  },
  paidInfo: {
    alignItems: 'flex-end',
  },
  paidLabel: {
    fontSize: 12,
    fontFamily: Typography.poppins.medium,
    color: '#000',
    marginBottom: 4,
  },
  paidAmount: {
    fontSize: 16,
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  offerInfo: {
    flex: 1,
    marginRight: 12,
  },
  offerLabel: {
    fontSize: 12,
    fontFamily: Typography.poppins.medium,
    color: '#000',
    marginBottom: 4,
  },
  offerValue: {
    fontSize: 14,
    fontFamily: Typography.poppins.semiBold,
    color: '#000',
  },
  redeemButton: {
    backgroundColor: Colors.brandGreen || '#1AD04F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redeemButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Typography.poppins.semiBold,
  },
  dateText: {
    fontSize: 12,
    fontFamily: Typography.poppins.medium,
    color: '#888',
    marginLeft: 8,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Typography.poppins.medium,
    color: '#888',
  },
});
