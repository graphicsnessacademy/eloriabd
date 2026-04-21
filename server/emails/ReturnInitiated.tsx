import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
  
  interface EmailProps {
    order: any;
  }
  
  export const ReturnInitiatedEmail = ({ order }: EmailProps) => {
    return (
      <Html>
        <Head />
        <Preview>আপনার রিটার্ন রিকোয়েস্ট গ্রহণ করা হয়েছে</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans p-4">
            <Container className="bg-white border border-gray-200 rounded-lg p-10 max-w-xl mx-auto shadow-sm">
              <Section className="text-center mb-8">
                <Heading className="text-2xl font-serif font-black text-gray-900 m-0">ELORIA BD</Heading>
              </Section>
  
              <Section className="mb-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-100 text-center text-yellow-800">
                <Text className="text-xl font-black leading-tight mb-2">Return request পেয়েছি — আমরা review করছি</Text>
              </Section>
  
              <Section className="mb-8 text-sm text-gray-600 leading-relaxed">
                <Text>
                    আপনার রিটার্ন রিকোয়েস্টটি আমাদের কাছে পৌঁছেছে। আমাদের টিম আপনার রিকোয়েস্টটি রিভিউ করছে। পরবর্তী ২-৩ কর্মদিবসের মধ্যে আমাদের একজন প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।
                </Text>
                <Hr className="border-gray-100 my-6" />
                <Text className="text-[11px] font-black uppercase text-gray-400 mb-1">Return Reference Number</Text>
                <Text className="text-sm font-black text-gray-900 m-0 leading-none">{order._id}</Text>
              </Section>
  
              <Section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <Text className="text-[10px] font-black uppercase text-gray-400 mb-2">Next Steps</Text>
                  <Text className="text-xs text-gray-700 m-0 leading-relaxed font-medium">
                      ১. আমাদের টিম পণ্যের ছবি এবং কারণ রিভিউ করবে। <br />
                      ২. কোয়ালিটি চেক শেষে আপনার পছন্দের মাধ্যম অনুযায়ী পেমেন্ট রিফান্ড অথবা প্রোডাক্ট এক্সচেঞ্জ হবে।
                  </Text>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default ReturnInitiatedEmail;
