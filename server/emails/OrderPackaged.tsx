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
  
  export const OrderPackagedEmail = ({ order }: EmailProps) => {
    return (
      <Html>
        <Head />
        <Preview>আপনার অর্ডার প্যাক করা হয়েছে 🎉</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans p-4">
            <Container className="bg-white border border-gray-200 rounded-lg p-10 max-w-xl mx-auto shadow-sm">
              <Section className="text-center mb-8">
                <Heading className="text-2xl font-serif font-black text-gray-900 m-0">ELORIA BD</Heading>
              </Section>
  
              <Section className="mb-8 p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
                <Text className="text-xl font-black text-green-700 leading-tight mb-2">আপনার অর্ডার pack হয়েছে!</Text>
                <Text className="text-green-600 text-[10px] font-black uppercase tracking-widest">Dispatching soon</Text>
              </Section>
  
              <Section className="mb-8">
                <Text className="text-gray-500 text-sm leading-relaxed text-center">
                   অর্ডার #<span className="text-gray-900 font-black">{order.orderNumber || order._id.slice(-8)}</span> প্যাক করে পাঠানো হয়েছে। শীঘ্রই ক্যুরিয়ার টিম আপনার সাথে যোগাযোগ করবে।
                </Text>
              </Section>
  
              <Section className="border-t border-gray-100 pt-8 text-center">
                <Text className="text-xs font-black uppercase text-gray-400">Items Summary</Text>
                <Text className="text-sm font-bold text-gray-700">
                    {order.items.length} artifacts are ready for dispatch.
                </Text>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default OrderPackagedEmail;
