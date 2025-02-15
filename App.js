import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import { RNCamera } from 'react-native-camera';
import axios from 'axios';

const exercises = ['Pushups', 'Squats', 'Bicep Curls'];

const App = () => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [exerciseStage, setExerciseStage] = useState(null);
  const cameraRef = useRef(null);
  const processingInterval = useRef(null);
  const lastStage = useRef(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'FlexItOut needs access to your camera',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setCameraPermission(true);
          }
        } else {
          setCameraPermission(true);
        }
      } catch (err) {
        console.warn(err);
      }
    };

    requestCameraPermission();
  }, []);

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setRepCount(0);
    startProcessingFrames(exercise);
  };

  const startProcessingFrames = (exercise) => {
    processingInterval.current = setInterval(async () => {
      if (cameraRef.current) {
        try {
          const options = { base64: true };
          const data = await cameraRef.current.takePictureAsync(options);
          
          const response = await axios.post('http://localhost:5000/process_frame', {
            frame: data.base64,
            exercise_type: exercise
          });
          
          // Update stage and rep count
          setExerciseStage(response.data.stage);
          
          // Only increment rep count when transitioning from down to up
          if (response.data.stage === 'up' && lastStage.current === 'down') {
            setRepCount(prevCount => prevCount + 1);
          }
          lastStage.current = response.data.stage;
        } catch (error) {
          console.error('Error processing frame:', error);
        }
      }
    }, 1000); // Process frame every second
  };

  useEffect(() => {
    return () => {
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FlexItOut</Text>
      {selectedExercise ? (
        <View style={styles.exerciseContainer}>
          <Text style={styles.exerciseText}>Selected: {selectedExercise}</Text>
          {cameraPermission && (
            <RNCamera
              style={styles.camera}
              type={RNCamera.Constants.Type.back}
              captureAudio={false}
              androidCameraPermissionOptions={{
                title: 'Permission to use camera',
                message: 'We need your permission to use your camera',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
            >
              <View style={styles.cameraOverlay}>
                <Text style={styles.repCounter}>Reps: {repCount}</Text>
                <Text style={styles.stageText}>Stage: {exerciseStage || 'N/A'}</Text>
              </View>
            </RNCamera>
          )}
        </View>
      ) : (
        exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise}
            style={styles.button}
            onPress={() => handleExerciseSelect(exercise)}
          >
            <Text style={styles.buttonText}>{exercise}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  exerciseContainer: {
    alignItems: 'center',
  },
  exerciseText: {
    fontSize: 20,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: 400,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  repCounter: {
    fontSize: 24,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  stageText: {
    fontSize: 18,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 5,
  },
});

export default App;
