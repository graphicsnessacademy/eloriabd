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
  } from "@react-email/components";
  import * as React from "react";
  
  interface EmailProps {
    order: any;
  }
  
  export const OrderDeliveredEmail = ({ order }: EmailProps) => {
    const firstItemProduct = order.items?.[0]?.productId?._id || order.items?.[0]?.productId || 'all';
    const reviewLink = `https://eloriabd.com/product/${firstItemProduct}`;

    return (
      <Html>
        <Head />
        <Preview>অর্ডার ডেলিভারি সম্পন্ন হয়েছে! ✓</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans p-4">
            <Container className="bg-white border border-gray-200 rounded-lg p-10 max-w-xl mx-auto shadow-sm">
              <Section className="text-center mb-8">
                <Heading className="text-2xl font-serif font-black text-gray-900 m-0">ELORIA BD</Heading>
              </Section>
  
              <Section className="mb-8 text-center text-green-700">
                <Text className="text-xl font-black leading-tight mb-2">অর্ডার delivered! Review দিন এবং ১০% ছাড় পান</Text>
              </Section>
  
              <Section className="mb-8 leading-relaxed text-center text-gray-600">
                <Text className="text-sm">
                   অভিনন্দন! আপনার অর্ডারটি সফলভাবে ডেলিভারি করা হয়েছে। আমরা আশা করি আপনার নতুন পোশাকটি আপনার পছন্দ হবে। 
                </Text>
                <Text className="text-sm mt-4">
                  আপনার মূল্যবান রিভিউ আমাদের জন্য অনেক বড় অনুপ্রেরণা। আপনার ছবিসহ একটি রিভিউ দিন এবং আপনার পরবর্তী অর্ডারে ১০% প্রোমো কোড জিতে নিন!
                </Text>
              </Section>
  
              <Section className="text-center">
                <Link href={reviewLink} className="bg-black text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest decoration-none inline-block">Review করুন</Link>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default OrderDeliveredEmail;
