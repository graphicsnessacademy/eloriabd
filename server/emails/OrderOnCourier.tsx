import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Link,
    Tailwind,
    Row,
    Column,
  } from "@react-email/components";
  import * as React from "react";
  
  interface EmailProps {
    order: any;
  }
  
  export const OrderOnCourierEmail = ({ order }: EmailProps) => {
    return (
      <Html>
        <Head />
        <Preview>আপনার অর্ডার ক্যুরিয়ারে পাঠানো হয়েছে 🚚</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans p-4">
            <Container className="bg-white border border-gray-200 rounded-lg p-10 max-w-xl mx-auto shadow-sm">
              <Section className="text-center mb-8">
                <Heading className="text-2xl font-serif font-black text-gray-900 m-0">ELORIA BD</Heading>
              </Section>
  
              <Section className="mb-8 text-center">
                <Text className="text-xl font-black text-gray-900 leading-tight mb-2">আপনার অর্ডার courier-এ আছে</Text>
                <Text className="text-gray-500 text-sm leading-relaxed">
                   আপনার পছন্দের শাড়ি এখন ক্যুরিয়ার টিমের সাথে পথে আছে। খুব শীঘ্রই এটি আপনার কাছে পৌঁছে যাবে।
                </Text>
              </Section>
  
              <Section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-8">
                  <Row className="mb-4">
                      <Column>
                          <Text className="text-[10px] font-black uppercase text-indigo-600 mb-1">Courier Partner</Text>
                          <Text className="text-sm font-black text-gray-900 m-0">{order.courierName || 'Partner'}</Text>
                      </Column>
                      <Column className="text-right">
                          <Text className="text-[10px] font-black uppercase text-indigo-600 mb-1">Tracking ID</Text>
                          <Text className="text-sm font-black text-gray-900 m-0">{order.trackingNumber || 'N/A'}</Text>
                      </Column>
                  </Row>
                  <Text className="text-[10px] text-gray-500 font-medium leading-relaxed italic border-t border-indigo-100 pt-4">
                      Estimated delivery: 2-3 business days within Dhaka, 4-6 days outside Dhaka.
                  </Text>
              </Section>
  
              <Section className="text-center">
                <Link href="#" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest decoration-none inline-block">Track your Parcel</Link>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default OrderOnCourierEmail;
