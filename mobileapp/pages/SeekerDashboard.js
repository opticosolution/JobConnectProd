import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Animated, Linking, ScrollView, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { getProfile, searchJobs, applyToJob, getTrendingSkills, getJobsAppliedFor } from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function SeekerDashboard({ isDarkMode, toggleDarkMode, route }) {
  const [user, setUser] = useState(route?.params?.user || null);
  const [searchSkills, setSearchSkills] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [message, setMessage] = useState('');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);
  const navigation = useNavigation();
  const [applyScales, setApplyScales] = useState({});
  const [connectScales, setConnectScales] = useState({});
  const [profileScale] = useState(new Animated.Value(1));
  const [logoutScale] = useState(new Animated.Value(1));
  const [downloadScale] = useState(new Animated.Value(1));
  const [searchScale] = useState(new Animated.Value(1));
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    if (!route?.params?.contact) {
      navigation.navigate('AuthForm', { role: 'seeker' });
      return;
    }
    fetchData();
  }, [route, navigation]);

  const fetchData = async () => {
    try {
      if (!user) {
        const isEmail = route.params.contact.includes('@');
        const response = await getProfile({
          role: 'seeker',
          ...(isEmail ? { email: route.params.contact } : { whatsappNumber: route.params.contact }),
        });
        const fetchedUser = response.data || {};
        setUser(fetchedUser);
        setAppliedJobs(fetchedUser.appliedJobs || []);
      }
  
      // Fetch only active jobs for seekers
      const jobResponse = await searchJobs({ available: true }); // Modified to only get active jobs
      
      const allJobs = jobResponse.data
        .filter(job => job && job._id && job.available) // Additional check for available jobs
        .map(job => ({
          ...job,
          applied: appliedJobs.some(applied => applied.jobId === job._id),
        }));
  
      console.log('Active Jobs:', allJobs);
  
      // Suggest top 5 jobs based on user skills
      if (user?.skills?.length) {
        const userSkills = Array.isArray(user.skills) ? user.skills : user.skills.split(',').map(s => s.trim());
        const filteredJobs = allJobs
          .filter(job => job.skills && job.skills.some(skill => userSkills.includes(skill)))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        console.log('Suggested Jobs:', filteredJobs);
        setSuggestedJobs(filteredJobs);
      }
  
      // Fetch trending jobs (ensure they're active)
      const trendingResponse = await getTrendingSkills();
      console.log("trending response", trendingResponse.data.data);
      setTrendingJobs(trendingResponse.data.data);
  
      // Set animation scales
      const scales = {};
      allJobs.forEach(job => {
        scales[job._id] = { apply: new Animated.Value(1), connect: new Animated.Value(1) };
      });
      setApplyScales(scales);
      setConnectScales(scales);
    } catch (error) {
      console.error('Fetch Data Error:', error);
      setMessage('Error fetching data: ' + error.message);
    }
  };

  const handleGetAppliedJobs = async () => {
    try {
      const seekerId = user?._id;
      const response = await getJobsAppliedFor(seekerId);
      setAppliedJobs(response.data.data || []);
      console.log("applied jobs", response.data.data);
      setShowAppliedJobs(true);
    } catch (err) {
      console.error('Error fetching applied jobs:', err);
    }
  };

  const handleSearch = async () => {
    try {
      const searchData = {
        skills: searchSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
        location: searchLocation.trim(),
        available: true // Explicitly request only active jobs
      };
  
      const response = await searchJobs(searchData);
  
      const filteredJobs = response.data
        .filter(job => job && job._id && job.available) // Double-check job is active
        .map(job => ({
          ...job,
          applied: appliedJobs.some(applied => applied.jobId === job._id),
        }));
  
      console.log('Active Searched Jobs:', filteredJobs);
      setSuggestedJobs(filteredJobs.slice(0, 5));
      setMessage(filteredJobs.length === 0 ? 'No active jobs found matching your criteria' : '');
    } catch (error) {
      console.error('Search Error:', error.response?.data || error);
      setMessage('Error searching jobs: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApply = async (jobId) => {
    try {
      const response = await applyToJob({ seekerId: user._id, jobId });
      setAppliedJobs(prev => [...prev, { jobId, title: suggestedJobs.find(job => job._id === jobId)?.jobTitle || 'Unknown', status: 'Applied' }]);
      setSuggestedJobs(prev => prev.map(job => job._id === jobId ? { ...job, applied: true } : job));
      setTrendingJobs(prev => prev.map(job => job._id === jobId ? { ...job, applied: true } : job));
      setMessage(response.message || 'Applied successfully');
    } catch (error) {
      setMessage('Error applying to job: ' + error.message);
    }
  };

  const handleWhatsAppConnect = (number, jobTitle) => {
    if (!number.startsWith('+')) {
      number = '+91' + number; // Change country code if needed
    }
  console.log("whatsapp number = ", number);
    const defaultMessage = `Hi, I'm interested in your job posting: ${jobTitle}`;
    Linking.openURL(`https://api.whatsapp.com/send?phone=${number.replace(/\D/g, '')}&text=${encodeURIComponent(defaultMessage)}`);
    setAppliedJobs(prev => [...prev, { jobId: jobTitle, title: jobTitle, status: 'Connected' }]);
  };


  const handleEditProfile = () => {
    navigation.navigate('SeekerProfile', { user });
  };

  const handlePressIn = (scale) => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = (scale) => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const formatSkills = (skills) => {
    if (Array.isArray(skills)) return skills.join(', ');
    if (typeof skills === 'string') return skills;
    return 'N/A';
  };

  const handleViewJobDetails =(job) =>{
    console.log("selected job in modal", job);
    setShowJobDetails(true);
    setSelectedJob(job);
  }

  const renderJobItem = ({ item }) => (
    <View style={styles.jobItem}>
      <Text style={[isDarkMode ? styles.darkText : styles.lightText]}>
      {item.skills?.map((skill, index) => (
      <Text key={index}>
        {skill}
        {index !== item.skills.length - 1 ? " | " : ""}
        </Text>
        ))}
      </Text>
      <Text style={[styles.jobDetail, isDarkMode ? styles.darkText : styles.lightText]}>
        Location: {item.location || 'N/A'}
      </Text>
      <View style={styles.jobActions}>                                    
        <TouchableOpacity
          style={[styles.actionButton, isDarkMode ? styles.darkButton : styles.lightButton, item.applied && styles.disabledButton]}
          onPress={() => handleApply(item._id)}
          onPressIn={() => handlePressIn(applyScales[item._id]?.apply)}
          onPressOut={() => handlePressOut(applyScales[item._id]?.apply)}
          disabled={item.applied}
        >
          <Animated.View style={{ transform: [{ scale: applyScales[item._id]?.apply || new Animated.Value(1) }] }}>
          <Text style={styles.buttonText}>
            {item.applicants.some(applicant => applicant.seekerId === user._id) ? 'Applied' : 'Apply'}
          </Text>
        </Animated.View>

        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isDarkMode ? styles.darkButton : styles.lightButton]}
          onPress={() => handleWhatsAppConnect(item.postedBy?.hrWhatsappNumber || '', item.skills[0])}
          onPressIn={() => handlePressIn(connectScales[item._id]?.connect)}
          onPressOut={() => handlePressOut(connectScales[item._id]?.connect)}
        >
          <Animated.View style={{ transform: [{ scale: connectScales[item._id]?.connect || new Animated.Value(1) }] }}>
            <Text style={styles.buttonText}>WhatsApp</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const keyExtractor = (item, index) => {
    return item?._id ? item._id.toString() : `index-${index}`;
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <Header title="Seeker Dashboard" toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topButtons}>
          <TouchableOpacity
            style={[styles.button, isDarkMode ? styles.darkButton : styles.lightButton]}
            onPress={handleEditProfile}
            onPressIn={() => handlePressIn(profileScale)}
            onPressOut={() => handlePressOut(profileScale)}
          >
            <Animated.View style={{ transform: [{ scale: profileScale }] }}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isDarkMode ? styles.darkButton : styles.lightButton]}
            onPress={handleGetAppliedJobs}
            onPressIn={() => handlePressIn(profileScale)}
            onPressOut={() => handlePressOut(profileScale)}
          >
            <Animated.View style={{ transform: [{ scale: profileScale }] }}>
              <Text style={styles.buttonText}>View Applied Jobs</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {user ? (
            <>
              <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Your Profile</Text>
              <View style={[styles.profileContainer, isDarkMode ? styles.darkProfileContainer : styles.lightProfileContainer]}>
                <Text style={[styles.profileText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Name: {user.fullName || 'N/A'}
                </Text>
                <Text style={[styles.profileText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Email: {user.email || 'N/A'}
                </Text>
                <Text style={[styles.profileText, isDarkMode ? styles.darkText : styles.lightText]}>
                  WhatsApp: {user.whatsappNumber || 'N/A'}
                </Text>
                <Text style={[styles.profileText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Job Names: {formatSkills(user.skills)}
                </Text>
                <Text style={[styles.profileText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Experience: {user.experience || 0} years
                </Text>
                <Text style={[styles.profileText, isDarkMode ? styles.darkText : styles.lightText]}>
                  Location: {user.location || 'N/A'}
                </Text>
              </View>

              <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Search Jobs</Text>
              <Text syle={[styles.label]} >Search By Job Name</Text>
              <TextInput
                style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                value={searchSkills}
                onChangeText={setSearchSkills}
                placeholder="Enter Job Names (comma-separated)"
                placeholderTextColor={isDarkMode ? '#888' : '#ccc'}
              />
              <Text syle={[styles.label]} >Search By Location</Text>
              <TextInput
                style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
                value={searchLocation}
                onChangeText={setSearchLocation}
                placeholder="Enter location"
                placeholderTextColor={isDarkMode ? '#888' : '#ccc'}
              />
              <TouchableOpacity
                style={[styles.button, isDarkMode ? styles.darkButton : styles.lightButton]}
                onPress={handleSearch}
                onPressIn={() => handlePressIn(searchScale)}
                onPressOut={() => handlePressOut(searchScale)}
              >
                <Animated.View style={{ transform: [{ scale: searchScale }] }}>
                  <Text style={styles.buttonText}>Search</Text>
                </Animated.View>
              </TouchableOpacity>

              <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Suggested Jobs</Text>
              <FlatList
                data={suggestedJobs}
                keyExtractor={keyExtractor}
                renderItem={renderJobItem}
                scrollEnabled={false}
              />

              <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Trending Jobs</Text>
              <FlatList
                data={trendingJobs}
                keyExtractor={keyExtractor}
                renderItem={renderJobItem}
                scrollEnabled={false}
              />

              {message && <Text style={[styles.message, isDarkMode ? styles.darkText : styles.lightText]}>{message}</Text>}
            </>
          ) : (
            <Text style={[styles.loading, isDarkMode ? styles.darkText : styles.lightText]}>Loading profile...</Text>
          )}
        </View>
      </ScrollView>
      {/* Applied Jobs Modal */}
      <Modal visible={showAppliedJobs} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Applied Jobs</Text>
              <FlatList
                data={appliedJobs}
                keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
                renderItem={({ item }) => (
                  <View style={styles.appliedJobItem}>
                    <View style={styles.jobDetails}>
                      <Text style={styles.appliedJobText}>{item.skills} - {item.location}</Text>
                    </View>
                    <TouchableOpacity style={styles.detailsButton} onPress={() => handleViewJobDetails(item)}>
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAppliedJobs(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Job Details Modal */}
        <Modal visible={showJobDetails} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, styles.jobDetailText]}>Job Details</Text>
              {selectedJob && (
                <>
                  <Text style={styles.jobDetailMain}>
                  {selectedJob.skills?.map((skill, index) => (
                    <Text key={index}>
                      {skill}
                      {index !== selectedJob.skills.length - 1 ? " | " : ""}
                    </Text>
                  ))}
                </Text>
                  <Text style={styles.jobDetailText}><Text style={styles.bold}>Company:</Text> {selectedJob.postedBy.companyName}</Text>
                  <Text style={styles.jobDetailText}><Text style={styles.bold}>Location:</Text> {selectedJob.location}</Text>
                  <Text style={styles.jobDetailText}><Text style={styles.bold}>Salary:</Text> {selectedJob.maxCTC || 'Not disclosed'}</Text>
                  <TouchableOpacity 
                  style={{
                    backgroundColor: 'green',
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginVertical: 5,
                  }}
                  onPress={() => handleWhatsAppConnect(selectedJob.postedBy?.hrWhatsappNumber || '', selectedJob.skills[0])}
                >
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowJobDetails(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      <Footer isDarkMode={isDarkMode} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  lightContainer: { backgroundColor: '#fff' },
  darkContainer: { backgroundColor: '#111' },
  scrollContent: { paddingBottom: 60, flexGrow: 1 },
  topButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, marginTop: 10 },
  content: { padding: 10, flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  profileContainer: { padding: 10, borderRadius: 5, marginBottom: 20 },
  lightProfileContainer: { backgroundColor: '#f0f0f0' },
  darkProfileContainer: { backgroundColor: '#333' },
  profileText: { fontSize: 16, marginBottom: 5 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  lightInput: { borderColor: '#ccc', color: '#000' },
  darkInput: { borderColor: '#555', color: '#ddd', backgroundColor: '#333' },
  jobItem: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  jobText: { fontSize: 16, fontWeight: 'bold' },
  jobDetail: { fontSize: 14, color: '#666', marginTop: 2 },
  jobActions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  actionButton: { padding: 5, borderRadius: 5 },
  disabledButton: { backgroundColor: '#666' },
  button: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', marginBottom: 10 },
  lightButton: { backgroundColor: '#007AFF' },
  darkButton: { backgroundColor: '#005BB5' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  message: { marginTop: 10, textAlign: 'center' },
  loading: { fontSize: 16, textAlign: 'center' },
  lightText: { color: '#000' },
  darkText: { color: '#ddd' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  appliedJobItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderColor: '#ddd' },
  appliedJobText: { fontSize: 16 },
  jobDetails: { flex: 1 },
  label: {
    position: "absolute",
    fontSize: 15,
    fontWeight: "700",
    zIndex: 10,
    paddingHorizontal: 4,
  },
  detailsButton: { backgroundColor: '#007AFF', padding: 8, borderRadius: 5 },
  detailsButtonText: { color: '#fff', fontSize: 14 },

  jobDetailText: { fontSize: 16, marginBottom: 5 },
  bold: { fontWeight: 'bold' },
  
  closeButton: { backgroundColor: '#007AFF', marginTop: 10, padding: 10, borderRadius: 5, alignItems: 'center' },
  jobDetailMain:{
    fontSize:20,
    fontWeight:'bold'
  }
}) 
// working code with search