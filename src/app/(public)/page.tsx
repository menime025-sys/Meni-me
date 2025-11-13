import HomeCarousel from "./_components/home-carousel";
import HotOfTheHanger from "./_components/hot-of-the-hanger";
import NewArrivals from "./_components/new-arrival-page";


const HomePage = () => {
  return (
    <main className="flex flex-col gap-24 bg-white pb-24">
      <HomeCarousel />
      <HotOfTheHanger />
      <NewArrivals />
    </main>
  );
};

export default HomePage;
