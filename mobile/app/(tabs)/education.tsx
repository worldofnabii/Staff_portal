import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EducationTab() {
  const [selectedTip, setSelectedTip] = useState<any | null>(null);

  const tips = [
    {
      week: 'Week 12',
      title: 'Managing Morning Sickness',
      desc: 'Eat small, frequent meals and stay hydrated.',
      readTime: '3 min read',
      icon: 'restaurant-outline',
      article: {
        intro: 'Morning sickness affects up to 80% of pregnant mothers. While commonly referred to as "morning" sickness, it can actually occur at any time of the day or night. It typically begins around week 6 and peaks around week 12 as pregnancy hormones scale.',
        sections: [
          {
            title: '1. Dietary Adjustments',
            content: 'Eat small, frequent meals throughout the day instead of three large ones. An empty stomach can trigger nausea as stomach acids build up. Keeping dry crackers or plain biscuits by your bedside and eating a couple before sitting up in the morning can work wonders.'
          },
          {
            title: '2. Hydration Strategies',
            content: 'Staying hydrated is critical, especially if you are vomiting. Sip liquids slowly between meals rather than drinking large amounts during meals. Cold, clear, carbonated, or sour drinks (like ginger ale, lemon water, or herbal teas) are often tolerated best.'
          },
          {
            title: '3. Natural Supplements',
            content: 'Natural remedies such as ginger tea, ginger candies, or clinical Vitamin B6 supplements have been proven to significantly alleviate nausea. Always speak with your MammaCare midwife or doctor before starting any supplements.'
          }
        ],
        conclusion: 'Listen to your body and give yourself permission to rest. Morning sickness is a standard sign of healthy pregnancy hormones and usually subsides entirely by week 16 to 20.'
      }
    },
    {
      week: 'Week 20',
      title: 'The Anatomy Scan Guide',
      desc: 'Your baby is now the size of a banana! Time for the mid-pregnancy ultrasound.',
      readTime: '4 min read',
      icon: 'sparkles-outline',
      article: {
        intro: 'The anatomy scan, also known as the mid-pregnancy anomaly ultrasound, is a landmark checkup performed between weeks 18 and 22. During this session, the sonographer uses detailed imaging to thoroughly assess your baby\'s physical structure and development.',
        sections: [
          {
            title: '1. What is Checked?',
            content: 'The ultrasound technician will examine all of your baby\'s major organs, including the brain, spine, face, heart, lungs, kidneys, and limbs. They will also measure the baby\'s growth, verify placenta placement relative to the cervix, measure amniotic fluid levels, and check the blood flow in the umbilical cord.'
          },
          {
            title: '2. Finding Out the Gender',
            content: 'If you wish to know your baby\'s biological sex and the baby is in a cooperative position, the technician can usually tell you during this scan. If you prefer a surprise, let the sonographer know at the very beginning of the session so they keep it confidential!'
          },
          {
            title: '3. How to Prepare',
            content: 'Unlike early pregnancy scans, you do not need a completely full, uncomfortable bladder for the anatomy scan. Wear loose, two-piece clothing, and prepare to spend about 30 to 45 minutes in the clinic as the technician takes detailed, precise measurements.'
          }
        ],
        conclusion: 'This scan is a wonderful milestone! You will receive printed sonogram photos to take home, giving you the first detailed look at your growing baby.'
      }
    },
    {
      week: 'Week 28',
      title: 'Third Trimester Milestones',
      desc: 'Monitor fetal kicks. You should feel at least 10 movements in 2 hours.',
      readTime: '4 min read',
      icon: 'heart-outline',
      article: {
        intro: 'Reaching week 28 marks the official beginning of your third and final trimester! Your baby\'s lungs, brain, and vital organs are rapidly maturing, and they are starting to open their eyes and practice breathing movements.',
        sections: [
          {
            title: '1. Fetal Kick Counts',
            content: 'Tracking your baby\'s daily movements is highly recommended in the third trimester. Choose a quiet hour each day, lie down comfortably on your left side, and count movements. You should easily feel at least 10 kicks, rolls, or flutters within a 2-hour window.'
          },
          {
            title: '2. Managing Physical Changes',
            content: 'As your baby grows, you may experience lower backaches, swollen ankles, and shortness of breath. Regular light stretching, elevating your feet when resting, wearing supportive shoes, and sleeping on your side with a pregnancy pillow can provide great relief.'
          },
          {
            title: '3. Clinical Warning Signs',
            content: 'Be aware of preeclampsia symptoms. Contact your doctor immediately if you notice sudden swelling of your hands/face, persistent severe headaches, visual disturbances (like flashing lights or blurriness), or a declining trend in your baby\'s daily movements.'
          }
        ],
        conclusion: 'Stay active with light walks, count fetal movements daily, and begin attending prenatal classes to prepare for the delivery day.'
      }
    },
    {
      week: 'Week 36',
      title: 'Pack Your Hospital Bag',
      desc: 'Prepare documents, clothes for baby, and supplies for yourself.',
      readTime: '3 min read',
      icon: 'bag-handle-outline',
      article: {
        intro: 'By week 36, your baby is almost full-term! It is highly recommended to have your hospital bag fully packed and resting near your front door, as labor can begin unexpectedly.',
        sections: [
          {
            title: '1. Essential Documentation',
            content: 'Keep all vital documents in an easily accessible folder: your MammaCare Digital QR health card (on your phone), government-issued identification cards, medical insurance papers, and a printed copy of your birth/delivery plan.'
          },
          {
            title: '2. Supplies for the Mother',
            content: 'Pack comfortable, loose-fitting clothes, button-front nightwear (essential for easy breastfeeding access), supportive nursing bras, high-absorbency maternity pads, toiletries (toothbrush, hairbrush, lip balm), and a pair of non-slip slippers.'
          },
          {
            title: '3. Supplies for the Baby',
            content: 'Pack three soft onesies, baby hats, socks, warm swaddle blankets, a pack of newborn-size diapers, baby wipes, and a clean outfit for going home. Ensure you have an approved infant car seat correctly installed in your vehicle before heading to the hospital.'
          }
        ],
        conclusion: 'Having your bag prepared in advance significantly reduces late-pregnancy anxiety, leaving you relaxed, organized, and ready to welcome your newborn!'
      }
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Educational Hub 📚</Text>
        <Text style={styles.subtitle}>Curated tips for a healthy pregnancy</Text>
      </View>

      <View style={styles.content}>
        {tips.map((tip, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => setSelectedTip(tip)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{tip.week}</Text></View>
              <Text style={styles.readTimeText}>{tip.readTime}</Text>
            </View>
            <View style={styles.titleRow}>
              <Ionicons name={tip.icon as any} size={20} color="#db2777" style={{ marginRight: 8 }} />
              <Text style={styles.title}>{tip.title}</Text>
            </View>
            <Text style={styles.desc}>{tip.desc}</Text>
            <View style={styles.readMoreRow}>
              <Text style={styles.readMoreText}>Tap to read article</Text>
              <Ionicons name="arrow-forward" size={14} color="#db2777" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ARTICLE READER MODAL */}
      {selectedTip && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={selectedTip !== null}
          onRequestClose={() => setSelectedTip(null)}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setSelectedTip(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selectedTip.title}</Text>
              <View style={{ width: 40 }} /> {/* Spacer to align title */}
            </View>

            {/* Modal Content */}
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalBadgeRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>{selectedTip.week}</Text></View>
                <Text style={styles.modalReadTime}>{selectedTip.readTime}</Text>
              </View>

              <Text style={styles.modalTitle}>{selectedTip.title}</Text>
              <View style={styles.divider} />

              <Text style={styles.articleIntro}>{selectedTip.article.intro}</Text>

              {selectedTip.article.sections.map((section: any, sIdx: number) => (
                <View key={sIdx} style={styles.articleSection}>
                  <Text style={styles.sectionSubheading}>{section.title}</Text>
                  <Text style={styles.sectionBody}>{section.content}</Text>
                </View>
              ))}

              <View style={styles.conclusionBox}>
                <Ionicons name="ribbon-outline" size={20} color="#be185d" style={{ marginBottom: 6 }} />
                <Text style={styles.conclusionText}>{selectedTip.article.conclusion}</Text>
              </View>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf2f8' },
  header: { padding: 30, paddingTop: 50, backgroundColor: '#fce7f3' },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#be185d' },
  subtitle: { fontSize: 16, color: '#db2777', marginTop: 5 },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#fbcfe8' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { backgroundColor: '#fbcfe8', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#be185d', fontWeight: 'bold', fontSize: 12 },
  readTimeText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
  desc: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 12 },
  readMoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f9fafb', paddingTop: 10 },
  readMoreText: { fontSize: 12, fontWeight: 'bold', color: '#db2777' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
  closeBtn: { padding: 5 },
  modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  modalScrollContent: { padding: 25 },
  modalBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalReadTime: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 32 },
  divider: { height: 4, width: 60, backgroundColor: '#be185d', borderRadius: 2, marginVertical: 20 },
  articleIntro: { fontSize: 15, color: '#374151', lineHeight: 24, fontStyle: 'italic', marginBottom: 20 },
  articleSection: { marginBottom: 20 },
  sectionSubheading: { fontSize: 16, fontWeight: 'bold', color: '#be185d', marginBottom: 8 },
  sectionBody: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  conclusionBox: { backgroundColor: '#fdf2f8', padding: 20, borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: '#fbcfe8' },
  conclusionText: { fontSize: 14, color: '#be185d', fontWeight: '600', lineHeight: 22 }
});
