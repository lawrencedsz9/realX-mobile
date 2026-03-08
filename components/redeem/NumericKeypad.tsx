import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function NumericKeypad({ onPress }) {
  const keys = [
    "1","2","3",
    "4","5","6",
    "7","8","9",
    "","0","delete"
  ];

  return (
    <View style={styles.container}>
      {keys.map((key, i) => (
        <TouchableOpacity
          key={i}
          style={styles.key}
          disabled={key === ""}
          onPress={() => onPress(key)}
        >
          {key === "delete" ? (
            <Ionicons name="backspace-outline" size={26} />
          ) : (
            <Text style={styles.text}>{key}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },

  key: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#FFF",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  text: {
    fontSize: 26,
    fontWeight: "600",
  },
});
