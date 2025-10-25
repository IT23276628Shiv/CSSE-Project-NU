import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  Alert,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = require("../../src/context/AuthContext").useAuth();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const onSubmit = async () => {
    // Clear previous errors
    let errors = [];

    // Validate empty fields
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      errors.push("Invalid email format");
    }

    // Validate password length
    if (!validatePassword(password)) {
      errors.push("Password must be at least 6 characters");
    }

    // Show validation errors
    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"));
      return;
    }

    try { 
      setLoading(true);
      await login(email.trim().toLowerCase(), password, "PATIENT");
    } catch (e) { 
      console.error("Login error:", e.message);
      
      // Show user-friendly error messages
      let errorMessage = "Invalid credentials. Please try again.";
      
      if (e.message.includes("Network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (e.message.includes("Invalid credentials")) {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (e.message.includes("inactive")) {
        errorMessage = "Your account has been deactivated. Please contact support.";
      }
      
      Alert.alert("Login Failed", errorMessage);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, padding: 22, justifyContent: "center" }}>
        {/* Illustration area */}
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <Image 
            source={{ uri: "https://i.imgur.com/6l2Qh0E.png" }} 
            style={{ width: 120, height: 120, borderRadius: 24, opacity: 0.9 }} 
          />
        </View>

        <Text style={{ 
          fontSize: 26, 
          fontWeight: "800", 
          color: colors.text, 
          marginBottom: 6 
        }}>
          Patient Login
        </Text>
        <Text style={{ color: colors.textMuted, marginBottom: 18 }}>
          Welcome back. Sign in to continue.
        </Text>

        {/* Email Input */}
        <View style={{ 
          backgroundColor: colors.card, 
          borderRadius: 18, 
          padding: 16, 
          marginBottom: 12 
        }}>
          <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            autoCorrect={false}
            style={{ 
              borderWidth: 1, 
              borderColor: colors.border, 
              borderRadius: 12, 
              padding: 12,
              fontSize: 16,
              color: colors.text
            }}
          />
        </View>

        {/* Password Input */}
        <View style={{ 
          backgroundColor: colors.card, 
          borderRadius: 18, 
          padding: 16 
        }}>
          <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 12, 
                padding: 12,
                paddingRight: 50,
                fontSize: 16,
                color: colors.text
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                padding: 4
              }}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={colors.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <PButton 
          title={loading ? "Signing in..." : "Sign in"} 
          onPress={onSubmit} 
          disabled={loading} 
          style={{ 
            marginTop: 18, 
            backgroundColor: colors.primary 
          }} 
        />

        {/* Info Message */}
        <View style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#F0F9FF', 
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary
        }}>
          <Text style={{ 
            textAlign: "center", 
            color: '#0C4A6E', 
            fontSize: 13,
            lineHeight: 18
          }}>
            ℹ️ Self-registration is currently disabled. Please contact your hospital reception to create an account.
          </Text>
        </View>

        {/* Development Mode Notice (Remove in Production) */}
        {__DEV__ && (
          <View style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#FFF3CD', 
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B'
          }}>
            <Text style={{ 
              textAlign: "center", 
              color: '#856404', 
              fontSize: 12,
              fontWeight: '600'
            }}>
              🔧 DEVELOPMENT MODE
            </Text>
            <Text style={{ 
              textAlign: "center", 
              color: '#856404', 
              fontSize: 11,
              marginTop: 4
            }}>
              Test credentials: patient1@example.com / pass1234
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}