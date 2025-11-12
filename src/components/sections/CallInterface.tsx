import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  PhoneCall,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import { createCallRecord, updateCallRecord, addCallLog } from "@/lib/firebaseService";
import { useCallStatusPolling } from "@/hooks/useCallStatusPolling";
import type { CallRecord } from "@/lib/types";

interface Message {
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: (phone: string) => string;
}

const countries: Country[] = [
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", format: (p) => p.replace(/\D/g, "").replace(/(\d{5})(\d{5})/, "$1 $2") },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", format: (p) => p.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", format: (p) => p.replace(/\D/g, "").replace(/(\d{4})(\d{6})/, "$1 $2") },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", format: (p) => p.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", format: (p) => p.replace(/\D/g, "").replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3") },
];

export const CallInterface = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "connected" | "failed">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);

  const addMessage = (type: "user" | "ai" | "system", content: string) => {
    setMessages((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  // Call status polling for automatic call end detection
  const { isPolling, endCallManually } = useCallStatusPolling({
    callId,
    isCallActive,
    onCallEnd: () => {
      setCallStatus("idle");
      setCallId(null);
      setIsCallActive(false);
      addMessage("system", "Call ended automatically.");
    },
    pollingInterval: 3000 // Poll every 3 seconds
  });

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      if (phoneNumber) {
        const cleaned = phoneNumber.replace(/\D/g, "");
        setPhoneNumber(country.format(cleaned));
      }
    }
  };

  const getFullPhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return selectedCountry.dialCode + cleaned;
  };

  const handlePhoneNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setPhoneNumber(selectedCountry.format(cleaned));
  };

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsCalling(true);
    setCallStatus("calling");

    if (isDemoMode) {
      addMessage("system", "Simulating call...");
      setTimeout(() => {
        setCallStatus("connected");
        setCallId("demo-" + Date.now());
        addMessage("ai", "Call initiated with Auralis AI.");
        addMessage("system", `Connected | Number: ${fullPhoneNumber}`);
        setIsCalling(false);
      }, 2000);
    } else {
      try {
        const response = await fetch("/api/elevenlabs-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: fullPhoneNumber }),
        });
        const data = await response.json();
        if (response.ok) {
          setCallStatus("connected");
          setCallId(data.callId);
          setIsCallActive(true); // Enable polling
          
          console.log('📞 Call initiated successfully:', {
            callId: data.callId,
            status: data.status,
            elevenlabsCallId: data.elevenlabsCallId
          });
          
          // The server-side API should have already written to Firestore
          // But we'll still try to write from frontend as a fallback
          const record: Omit<CallRecord, "createdAt" | "updatedAt"> = {
            callId: data.callId,
            agentId: data.agentId || undefined,
            toNumber: fullPhoneNumber,
            fromNumber: data.fromNumber || undefined,
            status: data.status || "calling",
            elevenlabsCallId: data.elevenlabsCallId,
            elevenlabsStatus: data.elevenlabsStatus,
          };
          
          // Try to create call record (will merge if already exists)
          createCallRecord(record).then(() => {
            console.log('✅ Frontend call record created/updated:', data.callId);
            
            // Add call log
            addCallLog(data.callId, {
              type: 'call_connected',
              message: 'Call connected successfully',
              data: { status: data.status, elevenlabsStatus: data.elevenlabsStatus }
            });
          }).catch((error) => {
            console.warn('⚠️ Frontend call record creation failed (server may have already written):', error);
          });
          
          addMessage("ai", "Connected with Auralis AI.");
        } else {
          setCallStatus("failed");
          addMessage("system", `Error: ${data.error}`);
        }
      } catch (err) {
        console.error(err);
        setCallStatus("failed");
        addMessage("system", "Network error occurred.");
      } finally {
        setIsCalling(false);
      }
    }
  };

  const handleEndCall = async () => {
    if (callId) {
      try {
        // Use the polling hook's manual end function
        await endCallManually();
        
        // Add call log
        await addCallLog(callId, {
          type: 'call_ended',
          message: 'Call ended by user',
          data: { endReason: 'user_ended' }
        });
        
        console.log('✅ Call ended successfully:', callId);
      } catch (error) {
        console.error('❌ Failed to update call status on end:', error);
      }
    }
    
    setCallStatus("idle");
    setCallId(null);
    setIsCallActive(false);
    addMessage("system", "Call ended.");
  };

  const getStatusIcon = () => {
    switch (callStatus) {
      case "calling":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "calling":
        return "Connecting...";
      case "connected":
        return isPolling ? "Connected (Monitoring)" : "Connected";
      case "failed":
        return "Failed";
      default:
        return "Ready";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-blue-50 rounded-xl">
      {/* Call Interface Card */}
      <Card className="bg-white shadow-md rounded-xl border border-blue-100">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <PhoneCall className="h-5 w-5 text-blue-500" />
              Call Auralis AI
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-blue-500" />
              <Label htmlFor="demo-mode" className="text-sm text-blue-700">
                Demo Mode
              </Label>
              <Switch
                id="demo-mode"
                checked={isDemoMode}
                onCheckedChange={setIsDemoMode}
                disabled={isCalling || callStatus === "connected"}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input & Call Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <Select
                value={selectedCountry.code}
                onValueChange={handleCountryChange}
                disabled={isCalling || callStatus === "connected"}
              >
                <SelectTrigger className="w-28 sm:w-40">
                  <SelectValue>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.dialCode}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <div className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                        <span className="text-gray-500">{c.dialCode}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder={`e.g. ${selectedCountry.format("1234567890")}`}
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                disabled={isCalling || callStatus === "connected"}
                className="flex-1"
              />
            </div>
            <Button
              onClick={callStatus === "connected" ? handleEndCall : handleMakeCall}
              disabled={isCalling}
              variant={callStatus === "connected" ? "destructive" : "default"}
              size="lg"
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isCalling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calling...
                </>
              ) : callStatus === "connected" ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" /> End Call
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" /> Make Call
                </>
              )}
            </Button>
          </div>

          {/* Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800">
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
              <Badge variant={isDemoMode ? "secondary" : "default"}>
                {isDemoMode ? "Demo" : "Live"}
              </Badge>
            </div>
            {callId && (
              <Badge variant="outline" className="mt-2 sm:mt-0 text-blue-700">
                ID: {callId.slice(0, 8)}...
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {messages.length > 0 && (
        <Card className="bg-white shadow-md rounded-xl border border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-800">Conversation Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    msg.type === "user"
                      ? "bg-blue-50 ml-6"
                      : msg.type === "ai"
                      ? "bg-green-50 mr-6"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      msg.type === "user"
                        ? "bg-blue-500 text-white"
                        : msg.type === "ai"
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {msg.type === "user" ? "U" : msg.type === "ai" ? "AI" : "S"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
