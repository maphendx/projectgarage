# ai/recommendation_model.py

import numpy as np
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
from keras import layers

class RecommendationModel:
    def __init__(self):
        self.model = self.build_model()
        self.scaler = StandardScaler()

    def build_model(self):
        model = keras.Sequential([
            layers.Dense(64, activation='relu', input_shape=(10,)),
            layers.Dense(32, activation='relu'),
            layers.Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model

    def train(self, data, labels):
        # Підготовка даних
        data = np.array(data)
        labels = np.array(labels)
        data = self.scaler.fit_transform(data)

        # Тренування моделі
        self.model.fit(data, labels, epochs=10)

    def predict(self, data):
        data = np.array(data)
        data = self.scaler.transform(data)
        predictions = self.model.predict(data)
        return predictions