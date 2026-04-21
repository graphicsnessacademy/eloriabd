import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
  
  interface EmailProps {
    order: any;
  }
  
  export const OrderCancelledEmail = ({ order }: EmailProps) => {
    return (
      <Html>
        <Head />
        <Preview>অর্ডার বাতিল করা হয়েছে (Order Cancelled)</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans p-4">
            <Container className="bg-white border border-gray-200 rounded-lg p-10 max-w-xl mx-auto shadow-sm">
              <Section className="text-center mb-8">
                <Heading className="text-2xl font-serif font-black text-gray-900 m-0">ELORIA BD</Heading>
              </Section>
  
              <Section className="mb-8 p-6 bg-red-50 rounded-2xl border border-red-100 text-center text-red-700">
                <Text className="text-xl font-black leading-tight mb-2">অর্ডার cancel হয়েছে — Order #{order._id.slice(-8)}</Text>
              </Section>
  
              <Section className="mb-8 text-center text-gray-600 leading-relaxed">
                <Text className="text-sm">
                   দুঃখিত! আপনার অর্ডারটি কোনো কারণে বাতিল করা হয়েছে। যদি আপনি আগেই পেমেন্ট করে থাকেন, তবে আমরা অতি শীঘ্রই আপনার রিফান্ড প্রসেস করবো।
                </Text>
                <Text className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-6 block">
                  Refund Note: Applicable if paid via Online Payment
                </Text>
              </Section>
  
              <Section className="text-center border-t border-gray-100 pt-8 mt-10">
                <Text className="text-[10px] text-gray-400">
                  যদি আপনার কোনো প্রশ্ন থাকে, তবে আমাদের ইনবক্স করুন। আমরা সাহায্য করতে পেরে খুশি হবো।
                </Text>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default OrderCancelledEmail;
