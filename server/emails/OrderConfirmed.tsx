import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
  
  interface EmailProps {
    order: any;
  }
  
  export const OrderConfirmedEmail = ({ order }: EmailProps) => {
    const previewText = `Your order ${order.orderNumber || order._id.slice(-8)} is confirmed!`;
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-gray-50 font-sans p-4">
            <Container className="bg-white border border-gray-200 rounded-lg p-10 max-w-xl mx-auto shadow-sm">
              <Section className="text-center mb-8">
                <Heading className="text-3xl font-serif font-black text-gray-900 m-0">ELORIA BD</Heading>
                <Text className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-2 font-black">Merchandise Allocation confirmed</Text>
              </Section>
  
              <Section className="mb-8">
                <Text className="text-xl font-black text-gray-900 leading-tight mb-2">আপনার অর্ডার confirmed হয়েছে! ✓</Text>
                <Text className="text-gray-500 text-sm leading-relaxed">
                  ধন্যবাদ {order.customer?.name}, আপনার অর্ডারটি আমাদের কাছে পৌঁছেছে। আপনার চমৎকার রুচির পরিচয় পেয়ে আমরা আনন্দিত। 
                  নিচে আপনার অর্ডারের সারসংক্ষেপ দেওয়া হলো:
                </Text>
              </Section>
  
              <Section className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8">
                  <Row>
                      <Column>
                          <Text className="text-[10px] uppercase font-black text-gray-400 mb-1">Order #</Text>
                          <Text className="text-sm font-black text-indigo-600 font-mono m-0">{order.orderNumber || order._id.slice(-8)}</Text>
                      </Column>
                      <Column className="text-right">
                          <Text className="text-[10px] uppercase font-black text-gray-400 mb-1">Payment</Text>
                          <Text className="text-sm font-black text-gray-900 m-0">{order.paymentMethod || 'COD'}</Text>
                      </Column>
                  </Row>
              </Section>
  
              <Section className="mb-8">
                <Text className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-2 mb-4">Article List</Text>
                {order.items.map((item: any, i: number) => (
                  <Row key={i} className="mb-4">
                    <Column className="w-16">
                      <Img src={item.image} className="w-14 h-16 object-cover rounded-lg border border-gray-100" />
                    </Column>
                    <Column className="px-4">
                      <Text className="text-xs font-black text-gray-900 m-0 uppercase">{item.name}</Text>
                      <Text className="text-[10px] text-gray-400 m-0 font-medium">{item.size} / {item.color}</Text>
                    </Column>
                    <Column className="text-right">
                      <Text className="text-xs font-black text-gray-900 m-0">৳{item.price.toLocaleString()}</Text>
                      <Text className="text-[10px] text-gray-400 m-0 font-medium">Qty: {item.quantity}</Text>
                    </Column>
                  </Row>
                ))}
              </Section>
  
              <Hr className="border-gray-100 my-6" />
  
              <Section className="mb-8">
                <Row className="mb-1">
                  <Column><Text className="text-xs font-bold text-gray-400 uppercase">Subtotal</Text></Column>
                  <Column className="text-right"><Text className="text-xs font-bold text-gray-900">৳{order.subtotal?.toLocaleString()}</Text></Column>
                </Row>
                <Row className="mb-1">
                  <Column><Text className="text-xs font-bold text-gray-400 uppercase">Courier</Text></Column>
                  <Column className="text-right"><Text className="text-xs font-bold text-gray-900">৳{order.shippingCost?.toLocaleString()}</Text></Column>
                </Row>
                <Row className="pt-4 mt-4 border-t border-gray-100">
                  <Column><Text className="text-sm font-black text-gray-900 uppercase">Total Settlement</Text></Column>
                  <Column className="text-right"><Text className="text-2xl font-black text-indigo-600">৳{order.total?.toLocaleString()}</Text></Column>
                </Row>
              </Section>
  
              <Section className="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <Text className="text-[10px] font-black uppercase text-indigo-600 mb-2">Shipping Destination</Text>
                  <Text className="text-xs font-bold text-gray-900 leading-relaxed m-0">
                      {order.shippingAddress?.address}, {order.shippingAddress?.area}, {order.shippingAddress?.district}
                  </Text>
              </Section>
  
              <Section className="text-center p-4 border-t border-gray-100 mt-10">
                <Text className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  অর্ডারটি প্যাক করার পরে আপনাকে পুনরায় জানানো হবে। ধন্যবাদ।
                </Text>
                <Link href="https://eloriabd.com" className="text-xs font-black uppercase text-gray-600 mt-4 block">Visit eloriabd.com</Link>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default OrderConfirmedEmail;
