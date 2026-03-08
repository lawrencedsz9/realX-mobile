import { View, TextInput, Text, StyleSheet } from "react-native";

export default function AmountInput({ value, onChange }) {
  return (
    <View>
      <Text style={styles.label}>Total Bill</Text>

      <View style={styles.input}>
        <Text style={styles.prefix}>QAR</Text>

        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          style={styles.text}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "600",
  },

  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 55,
  },

  prefix: {
    marginRight: 10,
    color: "#999",
    fontWeight: "600",
  },

  text: {
    flex: 1,
    fontSize: 18,
  },
});
